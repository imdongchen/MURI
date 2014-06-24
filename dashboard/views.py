from django.shortcuts import render
from models import *
from django.http import HttpResponse
import json
import networkx as nx
from networkx.readwrite import json_graph
from itertools import combinations
from django.template import Context
from django.db.models import Q
from itertools import chain
import copy

def index(request):
    bbox    = request.REQUEST.getlist('map')
    time    = request.REQUEST.getlist('time')
    message_ids   = request.REQUEST.getlist('messages')
    dialogs = []
    if (len(bbox) != 0):
        dialogs.append("map")
    if (len(time) != 0):
        dialogs.append("timeline")
    if (len(message_ids) != 0):
        dialogs.append("message_table")

    return render(request, 'dashboard/index.html', Context({"dialogs": dialogs}))


def data(request):
    """
    this provides the basic data structure for client
    the request should contain a list of datasets
    the return data is structured as:
        {
            'ele': [
                {'entry': <id>,
                'person': <id>,
                'location': <id>,
                'event': <id>,
                'resource': <id>,
                'organization': <id>,
                'relationship': <id>
                'date': <date string>},
                ...
            ],
            'entity_dict': {
                '<id>': { 'primary': {}, 'other': {} },
                ...
            },
            'dataentry_dict': {
                '<id>': { 'id': <id>, 'content': '<content>', 'date': '<date_string>' }
                ...
            },
            'relationship_dict': {
                '<id>': { 'primary': {}, 'other': {} }
                ...
            }
        }
    """
    res = {'ele': [], 'entity_dict': {}, 'dataentry_dict': {}, 'relationship_dict': {}}
    ele = res['ele']; entity_dict = res['entity_dict']; dataentry_dict = res['dataentry_dict']; relationship_dict = res['relationship_dict']
    ENTITY_ENUM = ['person', 'location', 'organization', 'event', 'resource']

    dataset_names = request.POST.getlist('datasets[]')

    if dataset_names and len(dataset_names):
        # step 1: get requested datasets
        datasets = Dataset.objects.filter(name__in=dataset_names)
        # step 2: get data entries in requested datasets
        data_entries = DataEntry.objects.filter(dataset__in=datasets).order_by('-date')
        # step 3: get entities annotated in each of those data entries
        for de in data_entries:
            # add to data entry list
            dataentry_dict[de.id] = de.get_attr()
            # 1st type of ele, consisting of data entry only
            # note the trick here: all entity ids are 0, and relationship id is -1
            ele.append({
                'dataentry': de.id,
                'person': 0, 'location': 0, 'event': 0, 'organization': 0, 'resource': 0, 'relationship': -1,
                'date': de.date.strftime('%m/%d/%Y')
            })
            # step 3.1: get annotations in those data entries
            annotations = []
            if request.user.is_authenticated():
                # if the user is logged in, get only his annotations; TODO: get annotations of the group the user belongs to
                annotations = de.annotation_set.filter(created_by=request.user)
            else:
                # if the user is not logged, get all annotations
                annotations = de.annotation_set.all()
            # step 3.2: get entities created in those annotations
            for ann in annotations:
                entities = ann.entities.all().select_subclasses()
                # step 4: for each entry-entity pair, create an 'ele' data record
                for entity in entities:
                    # Add to entity list
                    if entity.id not in entity_dict:
                        entity_dict[entity.id] = entity.get_attr()
                    # 2nd type of ele, consisting of data entry and one entity
                    # indicating that the entity is created within that entry. Note the trick here: relationship id is 0
                    fact = {}
                    fact['dataentry'] = de.id
                    fact['relationship'] = 0
                    fact['date'] = de.date.strftime('%m/%d/%Y')
                    for ENTITY_TYPE in ENTITY_ENUM:
                        if ENTITY_TYPE == entity.entity_type:
                            fact[ENTITY_TYPE] = entity.id
                        else:
                            fact[ENTITY_TYPE] = 0
                    ele.append(fact)
        # step 5: create the 3rd type of ele
        # step 5.1: get all requested entity ids
        entities = entity_dict.keys()
        # step 5.2: get all relationships involving those entities
        relationships = Relationship.objects.filter(Q(source__id__in=entities) & Q(target__id__in=entities))
        for rel in relationships:
            # add to relationship list
            relationship_dict[rel.id] = rel.get_attr()

            source_type = rel.source.entity_type
            target_type = rel.target.entity_type
            fact = {}
            fact['relationship'] = rel.id
            fact['date'] = rel.date.strftime('%m/%d/%Y') if rel.date else ''
            fact['dataentry'] = rel.dataentry.id if rel.dataentry else 0
            for ENTITY_TYPE in ENTITY_ENUM:
                if source_type == ENTITY_TYPE:
                    fact[ENTITY_TYPE] = rel.source.id
                elif target_type == ENTITY_TYPE:
                    fact[ENTITY_TYPE] = rel.target.id
                else:
                    fact[ENTITY_TYPE] = 0
            ele.append(fact)
            if source_type == target_type:
                # if the source and target refers to the same entity type
                # the algorithm above overwrites source entity
                # hence we need to add another fact about the source entity, with other information identical to the target entity
                fact2 = copy.deepcopy(fact)
                fact2[target_type] = rel.target.id
                ele.append(fact2)

    return HttpResponse(json.dumps(res), mimetype='application/json')
        #
        #
        # messages = Message.objects.all().order_by('-date')
        # for msg in messages:
        #     e_info = {}
        #     e_info = msg.getKeyAttr()
        #
        #
        #     e_info['organizations']  = []
        #     e_info['resources']  = []
        #     e_info['persons']  = []
        #     e_info['locations']  = []
        #     e_info['events']  = []
        #
        #     annotations = []
        #     if request.user.is_authenticated():
        #         annotations = msg.annotation_set.filter(created_by=request.user)
        #     else:
        #         annotations = msg.annotation_set.all()
        #
        #     for ann in annotations:
        #         entities = ann.entities.all().select_subclasses()
        #         for entity in entities:
        #             if hasattr(entity, 'organization'):
        #                 e_info['organizations'].append(entity.getKeyAttr())
        #             elif hasattr(entity, 'resource'):
        #                 e_info['resources'].append(entity.getKeyAttr())
        #             elif hasattr(entity, 'person'):
        #                 e_info['persons'].append(entity.getKeyAttr())
        #             elif hasattr(entity, 'location'):
        #                 e_info['locations'].append(entity.getKeyAttr())
        #             elif hasattr(entity, 'event'):
        #                 e_info['events'].append(entity.getKeyAttr())
        #
        #     response['data'] += flatten(e_info)


def flatten(dic):
    res = []
    for person in dic['persons']+[{}]:
        rec = {}
        rec['uid'] = dic['uid']
        rec['date'] = dic['date']
        rec['content'] = dic['content']

        if len(dic['persons']) != 0 and person == {}:
            continue
        rec['person'] = person
        for org in dic['organizations']+[{}]:
            if len(dic['organizations']) != 0 and org == {}:
                continue
            rec['organization'] = org
            for resource in dic['resources']+[{}]:
                if len(dic['resources']) != 0 and resource == {}:
                    continue
                rec['resource'] = resource
                for fp in dic['locations']+[{}]:
                    if len(dic['locations']) != 0 and fp == {}:
                        continue
                    rec['location'] = fp
                    for event in dic['events']+[{}]:
                        if len(dic['events']) != 0 and event == {}:
                            continue
                        rec['event'] = event
                        res.append(copy.deepcopy(rec))
    return res

def prepareNetwork(request):
    if request.method == 'GET':
        response = {}
        response['nodes'] = []
        response['links'] = []
        node_types = request.GET.getlist('entities[]', None)
        filter_id = request.GET.getlist('messages_id[]', None)

        if node_types == None or filter_id == None:
            return

        graph   = nx.DiGraph()

    # construct network on 'co-occurrance'
        msgs = Message.objects.filter(id__in=filter_id)
        annotations = []
        for msg in msgs:
            if request.user.is_authenticated():
                annotations = msg.annotation_set.filter(created_by=request.user)
            else:
                annotations = msg.annotation_set.all()
            if len(annotations) > 0:
                graph.add_node('m'+str(msg.id), msg.getKeyAttr())
                for ann in annotations:
                    entities = ann.entities.all().select_subclasses()
                    for ent in entities:
                        graph.add_node(ent.id, ent.getKeyAttr())
                        graph.add_edge('m'+str(msg.id), ent.id, rel='contains')
                        targets = ent.findTargets()
                        sources = ent.findSources()
                        for target in targets:
                            rels = Relationship.objects.filter(source=ent,target=target)
                            graph.add_node(target.id, target.getKeyAttr())
                            for rel in rels:
                                graph.add_edge(ent.id, target.id, rel=rel.description)
                        for source in sources:
                            rels = Relationship.objects.filter(source=source,target=ent)
                            graph.add_node(source.id, source.getKeyAttr())
                            for rel in rels:
                                graph.add_edge(source.id, ent.id, rel=rel.description)



#       linked_entities = list(events.select_subclasses())

#       for eve in events:
#           entities = list(chain(eve.findTargets(), eve.findSources()))
#           linked_entities += entities
#       for entity in linked_entities:
#           graph.add_node(entity.id, entity.getKeyAttr())

#       relations = Relationship.objects.filter( Q(source__in=linked_entities) & Q(target__in=linked_entities) )
#       for relation in relations:
#           graph.add_edge(relation.source.id, relation.target.id, relation.getAllAttr())

        return HttpResponse(json_graph.dumps(graph), mimetype='application/json')
    return

def network_relation(request):
    res = {}
    if request.method == "POST":
        source = request.POST.get('source', '')
        target = request.POST.get('target', '')
        rel    = request.POST.get('rel', '')

        if source == '' or target == '':
            return
        if source[0] == 'm':
            source = Message.objects.get(id=int(source[1:]))
        else:
            source = Entity.objects.get(id=int(source))
        if target[0] == 'm':
            target = Message.objects.get(id=int(target[1:]))
        else:
            target = Entity.objects.get(id=int(target))

        rel, created = Relationship.objects.get_or_create(source=source, target=target, relation=rel)
        rel.save()
        res['source'] = source.id
        res['target'] = target.id
        res['rel'] = rel.description
        res['id'] = rel.id

        return HttpResponse(json.dumps(res), mimetype='application/json')



def entity_attr(request):
    if request.method == "POST":
        entity = request.POST.get("entity", "")
        attr	= request.POST.get("attr", "")
        id  = request.POST.get("row_id", 0)
        id = str(id)
        val = request.POST.get("value", "")
        if not entity or not attr or not id:
            print "Warning: request params incorrect"
            return
        try:
            ent = Entity.objects.filter(id=id).select_subclasses()[0]
        except Entity.DoesNotExist:
            print "entity not exist for editing"
            return
        else:
            if not hasattr(ent, entity) :
                print "lala"
                return
            if not hasattr(ent, attr):
                return
            setattr(ent, attr, val)
            ent.save()
            return HttpResponse(val)
