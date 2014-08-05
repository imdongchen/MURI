from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
import json
import networkx as nx
from networkx.readwrite import json_graph
from itertools import combinations
from django.template import Context
from django.db.models import Q
from itertools import chain
import copy
from dateutil import parser
from django.contrib.auth.decorators import login_required
import csv

import settings
from models import *

@login_required
def upload_data(request):
    dataset_name = request.POST.get('dataset-name', '')
    if dataset_name == '':
        return HttpResponseBadRequest()


    dataset, created = Dataset.objects.get_or_create(
        name=dataset_name,
        created_by=request.user
    )
    f =  request.FILES['uploadField']
    reader = csv.reader(f, delimiter='\t', quotechar='"')
    for row in reader:
        try:
            dataentry = DataEntry.objects.create(
                content=row[1].strip(), # remove extra whitespace
                dataset=dataset,
                date=parser.parse(row[2])
            )
        except Exception as e:
            print 'Warning: data file upload failed: ', e
            error = 'Data file format unaccepted!'
            return HttpResponseBadRequest(error)
    return HttpResponse('success')



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

    if hasattr(settings, 'FORCE_SCRIPT_NAME'):
        PREFIX_URL = settings.FORCE_SCRIPT_NAME;
    else:
        PREFIX_URL = ''

    datasets = Dataset.objects.all()
    dataset_dict = {}
    for ds in datasets:
        dataset_dict[ds.name] = ds.dataentry_set.count()

    return render(request, 'dashboard/index.html', Context({
        "dialogs": dialogs,
        "PREFIX_URL": PREFIX_URL,
        "datasets": dataset_dict
    }))


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
                if not ann.entity: continue
                entities = Entity.objects.filter(id=ann.entity.id).select_subclasses()
                # step 4: for each entry-entity pair, create an 'ele' data record
                for entity in entities:
                    # Add to entity list
                    if entity.id not in entity_dict:
                        entity_dict[entity.id] = entity.get_attr()
                    # 2nd type of ele, consisting of data entry and one entity
                    # indicating that the entity is created within that entry.
                    # search relationship table for relationship id
                    # TODO: the search strategy is quite redundant, could be optimized
                    dataentry_entity_rels = Relationship.objects.filter(source=None, target=entity, dataentry=de)
                    for d_e_r in dataentry_entity_rels:
                        relationship_dict[d_e_r.id] = d_e_r.get_attr()
                        fact = {}
                        fact['dataentry'] = de.id
                        fact['relationship'] = d_e_r.id
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


#### abandoned ####
# def prepareNetwork(request):
#     if request.method == 'GET':
#         response = {}
#         response['nodes'] = []
#         response['links'] = []
#         node_types = request.GET.getlist('entities[]', None)
#         filter_id = request.GET.getlist('messages_id[]', None)
#
#         if node_types == None or filter_id == None:
#             return
#
#         graph   = nx.DiGraph()
#
#     # construct network on 'co-occurrance'
#         msgs = Message.objects.filter(id__in=filter_id)
#         annotations = []
#         for msg in msgs:
#             if request.user.is_authenticated():
#                 annotations = msg.annotation_set.filter(created_by=request.user)
#             else:
#                 annotations = msg.annotation_set.all()
#             if len(annotations) > 0:
#                 graph.add_node('m'+str(msg.id), msg.getKeyAttr())
#                 for ann in annotations:
#                     entities = ann.entities.all().select_subclasses()
#                     for ent in entities:
#                         graph.add_node(ent.id, ent.getKeyAttr())
#                         graph.add_edge('m'+str(msg.id), ent.id, rel='contains')
#                         targets = ent.findTargets()
#                         sources = ent.findSources()
#                         for target in targets:
#                             rels = Relationship.objects.filter(source=ent,target=target)
#                             graph.add_node(target.id, target.getKeyAttr())
#                             for rel in rels:
#                                 graph.add_edge(ent.id, target.id, rel=rel.description)
#                         for source in sources:
#                             rels = Relationship.objects.filter(source=source,target=ent)
#                             graph.add_node(source.id, source.getKeyAttr())
#                             for rel in rels:
#                                 graph.add_edge(source.id, ent.id, rel=rel.description)

#       linked_entities = list(events.select_subclasses())

#       for eve in events:
#           entities = list(chain(eve.findTargets(), eve.findSources()))
#           linked_entities += entities
#       for entity in linked_entities:
#           graph.add_node(entity.id, entity.getKeyAttr())

#       relations = Relationship.objects.filter( Q(source__in=linked_entities) & Q(target__in=linked_entities) )
#       for relation in relations:
#           graph.add_edge(relation.source.id, relation.target.id, relation.getAllAttr())

    #     return HttpResponse(json_graph.dumps(graph), mimetype='application/json')
    # return


def relationship(request):
    """
    Process post request for creating new relationships

    """
    res = {}
    if request.method == "POST":
        source = request.POST.get('source', '')
        target = request.POST.get('target', '')
        rel    = request.POST.get('rel', '')

        if source == '' or target == '':
            return
        source = source.split('-')
        target = target.split('-')
        if source[0] == 'dataentry':
            source = Dataentry.objects.get(id=int(source[1]))
        elif source[0] == 'entity':
            source = Entity.objects.get(id=int(source[1]))
        if target[0] == 'dataentry':
            target = Dataentry.objects.get(id=int(target[1]))
        elif target[0] == 'entity':
            target = Entity.objects.get(id=int(target[1]))

        user = None
        if request.user.is_authenticated():
            user = request.user
        rel, created = Relationship.objects.get_or_create(source=source, target=target, relation=rel, created_by=user)
        rel.save()
        res['relationship'] = rel.get_attr()

        return HttpResponse(json.dumps(res), mimetype='application/json')



def entity_attr(request):
    if request.method == "POST":
        attr	= request.POST.get("attribute", "")
        id  = request.POST.get("id", 0)
        id = str(id)
        val = request.POST.get("value", "")
        if not attr or not id:
            print "Warning: request params incorrect"
            return
        try:
            ent = Entity.objects.filter(id=id).select_subclasses()[0]
        except Entity.DoesNotExist:
            print "entity not exist for editing"
            return
        else:
            if hasattr(ent, attr):
                setattr(ent, attr, val)
                ent.save()
            else:
                # first, remove the entity-attribute link if the entity already has such an attribute
                existed_attr = ent.attributes.filter(attr=attr)
                if len(existed_attr):
                    ent.attributes.remove(existed_attr[0])
                # add another entity-attribute link
                attr, created = Attribute.objects.get_or_create(attr=attr, val=val)
                ent.attributes.add(attr)

            return HttpResponse(val)
