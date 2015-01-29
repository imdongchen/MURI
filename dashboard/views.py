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
from activitylog.views import serverlog


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
def get_case_info(request):
    res = {}
    id = request.GET.get('case')
    if not id:
        return HttpResponseBadRequest()

    case = Case.objects.get(id=int(id))
    datasets = case.dataset_set.all()
    dataset_dict = {}
    for ds in datasets:
        dataset_dict[ds.id] = ds.get_attr()

    # identify the group the user is in
    group = case.groups.all() & request.user.groups.all()
    group = group[0] # there is actually only one group per case per user

    group_dict = {'id': group.id, 'name': group.name}

    # get users in the group
    users = group.user_set.all()
    user_dict = {}
    for u in users:
        user_dict[u.id] = {
            'id': u.id,
            'name': u.username
        }


    res = {'case': case.id, 'datasets': dataset_dict, 'group': group_dict, 'users': user_dict}

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
    group = Group.objects.get(id=int(request.POST['group']))
    case = Case.objects.get(id=int(request.POST['case']))

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

        # step 3: get entities
        entities = Entity.objects.filter(case=case, group=group)
        for entity in entities:
            entity_dict[entity.id] = entity.get_attr()

        # step 4: get relationships
        relationships = Relationship.objects.filter(case=case, group=group)
        for rel in relationships:
            rel_info = rel.get_attr()
            relationship_dict[rel.id] = rel_info

            # step 5: construct another two types of entity-relationship-entity
            if rel.source:
                # 2nd type of ele, consisting of entity and entity
                ele.append({
                    'dataentry': rel_info[primary].get('dataentry', None),
                    rel.source.entity_type: rel_info['primary']['source'],
                    rel.target.entity_type: rel_info['primary']['target'],
                    'relationship': rel_info['primary']['id'],
                    'date': rel_info['primary'].get('date', None)
                })
                if rel.source.entity_type == rel.target.entity_type:
                    # if the two entities are of the same type
                    # then in the previous statement,
                    # target entity overwrites source entity
                    # add it back here
                    # thus, a relationship between two entities of the same entity type
                    # will generate two ele
                    ele.append({
                        'dataentry': rel_info[primary].get('dataentry', None),
                        rel.source.entity_type: rel_info['primary']['source'],
                        'relationship': rel_info['primary']['id'],
                        'date': rel_info['primary'].get('date', None)
                    })
            else:
                # 3rd type of ele, consisting of datanetry and entity
                ele.append({
                    'dataentry': rel_info['primary']['dataentry'],
                    rel.target.entity_type: rel_info['primary']['target'],
                    'relationship': rel_info['primary']['id'],
                    'date': rel_info['primary'].get('date', None)
                })

    return HttpResponse(json.dumps(res), content_type='application/json')



@login_required
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
        case   = request.POST.get('case', '')
        group  = request.POST.get('group', '')

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

        case = Case.objects.get(id=case)
        group = Case.objects.get(id=group)

        rel, created = Relationship.objects.get_or_create(source=source, target=target, relation=rel, created_by=user, description=desc, case=case, group=group)
        rel.save()
        res['relationship'] = rel.get_attr()
        res['created'] = created;

        operation = ''
        if created:
            operation = 'created'
            sync.views.relationship_create(res, case, group, request.user)
        else:
            operation = 'updated'
            sync.views.relationship_update(res, case, gorup, request.user)

        serverlog({
            'user': request.user,
            'operation': operation,
            'item': 'relationship',
            'data': {
                'id': rel.id,
                'name': rel.relation,
                'target': target.name,
                'source': source.name
            },
            'case': case,
            'group': group,
            'public': True
        })
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

        serverlog({
            'user': request.user,
            'operation': 'delete',
            'item': 'relationship',
            'data': {
                'id': rel.id,
                'name': rel.relation,
                'target': target.name,
                'source': source.name
            },
            'case': case,
            'group': group,
            'public': True
        })

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
