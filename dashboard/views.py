from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
import json
from django.db.models import Q
import copy
from dateutil import parser
from django.contrib.auth.decorators import login_required
from django.template import Context
import csv

import settings
from django.contrib.auth.models import Group, User
from models import Attribute, Entity, Case, Dataset, DataEntry, Location, Person, Organization, Event, Resource, Relationship

import sync


def get_cases(request):
    res = []

    groups = request.user.group_set.all()
    cases  = Cases.objects.filter(groups__in=groups)

    for case in cases:
        res.append({
            'name': case.name,
            'description': case.description
        })
    return HttpResponse(json.dumps(res), content_type='application/json')

@login_required
def upload_data(request):
    res = {}
    dataset_name = request.POST.get('dataset-name', '')
    if dataset_name == '':
        return HttpResponseBadRequest()

    dataset, created = Dataset.objects.get_or_create(
        name=dataset_name,
        created_by=request.user
    )
    f =  request.FILES['uploadField']
    reader = csv.reader(f, delimiter='\t', quotechar='"')
    count = 0
    for row in reader:
        try:
            dataentry = DataEntry.objects.create(
                content=row[1].strip(), # remove extra whitespace
                dataset=dataset,
                date=parser.parse(row[2])
            )
            count += 1
        except Exception as e:
            print 'Warning: data file upload failed: ', e
            error = 'Data file format unaccepted!'
            return HttpResponseBadRequest(error)
    res[dataset.id] = dataset.get_attr()
    return HttpResponse(json.dumps(res), content_type='application/json')



def index(request):
    if hasattr(settings, 'FORCE_SCRIPT_NAME'):
        PREFIX_URL = settings.FORCE_SCRIPT_NAME;
    else:
        PREFIX_URL = ''

    groups = request.user.groups.all()
    cases  = Case.objects.filter(groups__in=groups)

    return render(request, 'dashboard/index.html', {
        "PREFIX_URL": PREFIX_URL,
        "cases": cases,
    })


def dataset(request):
    id = request.GET.get('case')
    if not id:
        return HttpResponseBadRequest()
    case = Case.objects.get(id=id)
    datasets = case.dataset_set.all()
    dataset_dict = {}
    for ds in datasets:
        dataset_dict[ds.id] = ds.get_attr()
    return HttpResponse(json.dumps(dataset_dict), content_type='application/json')


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
    res = {'ele': [], 'dataset_dict': {}, 'entity_dict': {}, 'dataentry_dict': {}, 'relationship_dict': {}}
    ele = res['ele']; dataset_dict = res['dataset_dict']; entity_dict = res['entity_dict']; dataentry_dict = res['dataentry_dict']; relationship_dict = res['relationship_dict']
    ENTITY_ENUM = ['person', 'location', 'organization', 'event', 'resource']

    dataset_id = request.POST.getlist('datasets[]')

    if dataset_id and len(dataset_id):
        # step 1: get requested datasets
        datasets = Dataset.objects.filter(id__in=dataset_id)
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
                'date': dataentry_dict[de.id]['date']
            })

            # step 3.1: get annotations in those data entries
            annotations = []
            if request.user.is_authenticated():
                # if the user is logged in, get only his annotations; TODO: get annotations of the group the user belongs to
                # annotations = de.annotation_set.filter(created_by=request.user)
                annotations = de.annotation_set.all()
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

    return HttpResponse(json.dumps(res), content_type='application/json')



def relationship(request):
    """
    Process post request for creating new relationships

    """
    res = {}
    if request.method == "POST":
        source = request.POST.get('source', '')
        target = request.POST.get('target', '')
        rel    = request.POST.get('rel', '')
        desc   = request.POST.get('desc', '')

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
        rel, created = Relationship.objects.get_or_create(source=source, target=target, relation=rel, created_by=user, description=desc)
        rel.save()
        res['relationship'] = rel.get_attr()
        res['created'] = created;

        if created:
            sync.views.relationship_create(res, request.user)
        else:
            sync.views.relationship_update(res, request.user)

        return HttpResponse(json.dumps(res), content_type='application/json')
    elif request.method == 'DELETE':
        data = json.loads(request.body)
        id     = data.get('id')

        # only consider deleting relationship between two entities
        # the request to delete relationship between dataentry and entity
        # is more complex
        # leave it for later
        rel = Relationship.objects.get(id=int(id))
        res['relationship'] = rel.get_attr()
        rel.delete()

        sync.views.relationship_delete(res, request.user)

        return HttpResponse(json.dumps(res), content_type='application/json')



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
