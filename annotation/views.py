# Create your views here.
from dashboard.models import *
from models import Annotation
import json
from django.views.decorators.http import require_GET
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest
from django.contrib.gis.geos import fromstr
from django.http import QueryDict
from activitylog.views import serverlog

import sync

def get_or_create_entity(json):
    created = False
    id = json.get('id', 0)
    entity_type = json.get('entity_type', '')
    attrs = json.get('attribute', [])

    if id and entity_type:
        entity = Entity.objects.filter(id=id, entity_type=entity_type).select_subclasses()
        if len(entity) > 0:
            obj = entity[0]
        else:
            obj = create_entity(json)
            created = True
    else:
        obj = create_entity(json)
        created = True

    fields = obj._meta.get_all_field_names()
    # add attributes to entity
    if not created:
        # if the entity already exists, reassign its attributes
        obj.attributes.clear()

    obj.name = json['name']
    for attr in attrs:
        if attr in fields:
            # set field value
            if entity_type == 'location' and attr == 'geometry': # special field
                wkt = attrs[attr]
                try:
                    geometry = fromstr(wkt)
                    obj.geometry = geometry
                except:
                    print 'Warning: geometry format unrecognized, ', wkt
            else: # normal field such as char and int
                setattr(obj, attr, attrs[attr])
        else:
            attribute, created = Attribute.objects.get_or_create(attr=attr, val=attrs[attr])
            obj.attributes.add(attribute)

    obj.save()
    return obj, created


def create_entity(json):
    name = json['name']

    if name:
        entity_type = json['entity_type']
        if entity_type == 'person':
            obj, created = Person.objects.get_or_create(name=name)
        if entity_type == 'location':
            obj, created = Location.objects.get_or_create(name=name)
        if entity_type == 'event':
            obj, created = Event.objects.get_or_create(name=name)
        if entity_type == 'resource':
            obj, created = Resource.objects.get_or_create(name=name)
        if entity_type == 'organization':
            obj, created = Organization.objects.get_or_create(name=name)

        return obj

    else:
        return None


def annotation(request, id=0):
    res = {}
    if request.method == 'POST':
        # create new annotation
        data = json.loads(request.body)
        entity, created = get_or_create_entity(data['tag'])
        ranges = data.get('ranges', '')
        if not ranges:
            return HttpResponseBadRequest()
        try:
            entry = DataEntry.objects.get(id=data['anchor'])
        except DataEntry.DoesNotExist:
            return HttpResponseNotFound()
        else:
            user = None
            if request.user.is_authenticated():
                user = request.user
            annotation = Annotation.objects.create(startOffset=ranges[0]['startOffset'],
                endOffset=ranges[0]['endOffset'],
                dataentry=entry,
                entity = entity,
                start=ranges[0]['start'],
                end=ranges[0]['end'],
                created_by=user
            )
            relationship = Relationship.objects.create(
                target=entity,
                dataentry=entry,
                date=entry.date,
                relation='contain',
                created_by=user
            )
            res['annotation'] = annotation.serialize()
            res['relationship'] = relationship.get_attr()
            res['entity'] = entity.get_attr()

            # sync annotation
            sync.views.annotation_create(res)

            return HttpResponse(json.dumps(res), mimetype='application/json')

    elif request.method == 'PUT':
        # update annotation
        if id:
            try:
                annotation = Annotation.objects.get(id=id)
            except Annotation.DoesNotExist:
                print 'Error: annotation not found: ', id
                return HttpResponseNotFound()
            else:
                data = json.loads(request.body)
                tag = data['tag']
                entity, created = get_or_create_entity(data['tag'])
                entry = annotation.dataentry
                old_entity = annotation.entity

                if old_entity.id != entity.id:
                    # entity changed
                    relationship = Relationship.objects.get(
                        target=annotation.entity,
                        dataentry=annotation.dataentry,
                        relation='contain',
                    )
                    relationship.target = entity
                    annotation.entity = entity
                    relationship.save()
                    annotation.save()
                    res['relationship'] = relationship.get_attr()

                res['annotation'] = annotation.serialize()
                res['entity'] = entity.get_attr()
                return HttpResponse(json.dumps(res), mimetype='application/json')
        else:
            print 'Error: no annotation id received'
            return HttpResponseBadRequest()

    elif request.method == 'DELETE':
        if id:
            try:
                annotation = Annotation.objects.get(id=id)
            except Annotation.DoesNotExist:
                print 'Error: annotation not found: ', id
                return HttpResponseNotFound()
            else:
                relationship = Relationship.objects.get(target=annotation.entity, dataentry=annotation.dataentry, relation='contain')
                res['relationship'] = relationship.get_attr()
                relationship.delete()
                annotation.delete()
                return HttpResponse(json.dumps(res), mimetype='application/json')
        else:
            return HttpResponseBadRequest()

    else:
        return HttpResponseBadRequest()


def annotations(request):
    if request.method == 'GET':
        annotations = []
        # if request.user.is_authenticated():
        #     anns = Annotation.objects.filter(created_by=request.user)
        # else:
        anns = Annotation.objects.all() # TODO: limit annotations to corresponding datasets

        for ann in anns:
            annotations.append(ann.serialize())
        return HttpResponse(json.dumps(annotations), mimetype='application/json')
    elif request.method == 'POST':
        res = {'annotations': [], 'entity': {}, 'relationships': []};
        data = json.loads(request.body)

        # all annotations are with the same entity
        entity, created = get_or_create_entity(data[0]['tag'])
        for ann in data:
            ranges = ann.get('ranges', '')
            if not ranges:
                return HttpResponseBadRequest()
            try:
                entry = DataEntry.objects.get(id=ann['anchor'])
            except DataEntry.DoesNotExist:
                return HttpResponseNotFound()
            else:
                user = None
                if request.user.is_authenticated():
                    user = request.user
                annotation = Annotation.objects.create(startOffset=ranges[0]['startOffset'],
                    endOffset=ranges[0]['endOffset'],
                    dataentry=entry,
                    entity = entity,
                    start=ranges[0]['start'],
                    end=ranges[0]['end'],
                    created_by=user
                )
                relationship = Relationship.objects.create(
                    target=entity,
                    dataentry=entry,
                    date=entry.date,
                    relation='contain',
                    created_by=user
                )
                res['annotations'].append(annotation.serialize())
                res['relationships'].append(relationship.get_attr())
        res['entity'] = entity.get_attr()
        return HttpResponse(json.dumps(res), mimetype='application/json')

    elif request.method == 'PUT':
        # update annotations
        res = {'annotations': [], 'entity': {}, 'relationships': []};
        data = json.loads(request.body)
        entity = None
        for ann in data:
            try:
                annotation = Annotation.objects.get(id=ann['id'])
            except Annotation.DoesNotExist:
                print 'Error: annotation not found: ', ann
                return HttpResponseNotFound()
            else:
                tag = ann['tag']
                entity, created = get_or_create_entity(tag)
                entry = annotation.dataentry
                old_entity = annotation.entity

                if old_entity.id != entity.id:
                    # entity changed
                    relationships = Relationship.objects.filter(
                        target=annotation.entity,
                        dataentry=annotation.dataentry,
                        relation='contain',
                    )
                    for relationship in relationships:
                        relationship.target = entity
                        relationship.save()
                        res['relationships'].append(relationship.get_attr())

                    annotation.entity = entity
                    annotation.save()
                    res['annotations'].append(annotation.serialize())

        res['entity'] = entity.get_attr()
        return HttpResponse(json.dumps(res), mimetype='application/json')

    elif request.method == 'DELETE':
        res = {'annotations': [], 'entity': {}, 'relationships': []};
        data = json.loads(request.body)
        for ann in data:
            try:
                annotation = Annotation.objects.get(id=ann['id'])
            except Annotation.DoesNotExist:
                print 'Error: annotation not found: ', ann
            else:
                relationships = Relationship.objects.filter(target=annotation.entity, dataentry=annotation.dataentry, relation='contain')
                for rel in relationships:
                    res['relationships'].append(rel.get_attr())
                    rel.delete()
                annotation.delete()
        return HttpResponse(json.dumps(res), mimetype='application/json')


def get_or_create_annotation(request):
    if request.method == 'GET':
        annotations = []
        if request.user.is_authenticated():
            anns = Annotation.objects.filter(created_by=request.user)
        else:
            anns = Annotation.objects.all()

        for ann in anns:
            annotations.append(ann.serialize())
        return HttpResponse(json.dumps(annotations), mimetype='application/json')
    if request.method == 'POST':
        res = None
        data = json.loads(request.body)

        if isinstance(data, list):
            res = {'annotations': [], 'entity': {}, 'relationships': []};

            for d in data:
                ann = create_annotation(request, d)
                r = save_annotation(request, ann, d)
                res['annotations'].append(r['annotation'])
                res['entity'] = r['entity']
                res['relationships'].append(r['relationship'])

            log = {}
            log['operation'] = 'add annotations'
            annotations_id = []
            for d in res['annotations']:
                annotations_id.append(d['id'])
            log['data'] = json.dumps({'annotations_id': annotations_id})
            serverlog(request, log)

        elif isinstance(data, dict):
            res = {}
            ann = create_annotation(request, data)
            res = save_annotation(request, ann, data)
            log = {}
            log['operation'] = 'add annotation'
            log['data'] = json.dumps({'annotation_id': res['annotation']['id']})
            serverlog(request, log)
        return HttpResponse(json.dumps(res), mimetype='application/json')
    if request.method == 'DELETE':
        res = {}
        data = json.loads(request.body)
        for d in data:
            try:
                ann = Annotation.objects.get(id=d['id'])
            except Annotation.DoesNotExist:
                print 'Delete annotation failed: annotation id %s does not exist' % d['id']
                return HttpResponseNotFound()
            else:
                ann.delete()
        return HttpResponse(json.dumps(res), mimetype='application/json')



def create_annotation(request, data):
    ranges = data.get('ranges', [])
    anchor = data.get('anchor', '0')
    quote  = data.get('quote', '')

    if len(ranges) == 0 or quote == '' or 'startOffset' not in ranges[0] or 'endOffset' not in ranges[0] or anchor == '0':
        print "error: no tag received"
        print ranges, anchor, quote
        return

    entry = None
    try:
        entry = DataEntry.objects.get(id=anchor)
    except DataEntry.DoesNotExist:
        print "Error: data entry not exist for ID: ", anchor
        return
    else:
        user = None
        if request.user.is_authenticated():
            user = request.user
        annotation = Annotation.objects.create(startOffset=ranges[0]['startOffset'],
            endOffset=ranges[0]['endOffset'],
            dataentry=entry,
            start=ranges[0]['start'],
            end=ranges[0]['end'],
            created_by=user
        )
        return annotation

def save_annotation(request, annotation, data):
    res = {'annotation': {}, 'entity': {}, 'relationship': {}}
    tag  = data['tag']
    name = tag['name']

    if name:
        entity_type = tag['entity_type']
        if entity_type == 'person':
            obj, created = Person.objects.get_or_create(name=name)
        if entity_type == 'location':
            obj, created = Location.objects.get_or_create(name=name)
        if entity_type == 'event':
            obj, created = Event.objects.get_or_create(name=name)
        if entity_type == 'resource':
            obj, created = Resource.objects.get_or_create(name=name)
        if entity_type == 'organization':
            obj, created = Organization.objects.get_or_create(name=name)

        # remove all attribute relations first
        if not created:
            obj.attributes.clear()
        for attr in tag['attribute']:
            fields = obj._meta.get_all_field_names()
            if attr in fields:
                if entity_type == 'location' and attr == 'geometry':
                    wkt = tag['attribute'][attr]
                    try:
                        geometry = fromstr(wkt)
                        obj.geometry = geometry
                    except:
                        print 'Warning: geometry format unrecognized, ', wkt
                else:
                    setattr(obj, attr, tag['attribute'][attr])
            else:
                attribute, created = Attribute.objects.get_or_create(attr=attr, val=tag['attribute'][attr])
                obj.attributes.add(attribute)
        obj.save()

        annotation.entity = obj
        res['entity'] = obj.get_attr()
        # add to relationship
        rel, created = Relationship.objects.get_or_create(source=None, target=obj, dataentry=annotation.dataentry)
        if created:
            rel.relation = 'contain'
            rel.date = annotation.dataentry.date
            rel.created_by = annotation.created_by
            rel.save()
        res['relationship'] = rel.get_attr()

    annotation.save()

    res['annotation'] = annotation.serialize()

    return res


def process_annotation(request, id):
    res = {}
    if request.method == 'DELETE':
        try:
            ann = Annotation.objects.get(id=id)
        except Annotation.DoesNotExist:
            print 'Delete annotation failed: annotation id %s does not exist' % id
            return HttpResponseNotFound()
        else:
            ann.delete()
            return HttpResponse(json.dumps(res), mimetype='application/json')
    if request.method == 'PUT':
        try:
            ann = Annotation.objects.get(id=id)
        except Annotation.DoesNotExist:
            print 'Update annotation failed: annotation id %s does not exist' % id
        else:
            # remove entity relation first
            ann.entity = None
            data = json.loads(request.body)

            res = save_annotation(request, ann, data)

        return HttpResponse(json.dumps(res), mimetype='application/json')


def tag(request):
    res = {}
    # Edit tag semantics
    if request.method == 'POST':
        uid = request.POST.get('uid', 0)
        uid = int(uid)
        if uid == 0:
            return

        entity = Entity.objects.filter(id=uid).select_subclasses()[0]

        for attr in request.POST:
            setattr(entity, attr, request.POST[attr])
        entity.save()

        res = entity.getKeyAttr()

        return HttpResponse(json.dumps(res), mimetype='application/json')
