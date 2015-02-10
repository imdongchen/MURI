# Create your views here.
import json
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest
from django.contrib.gis.geos import fromstr
from django.http import QueryDict

from dateutil.parser import parse as parse_date

from activitylog.views import serverlog
from dashboard.models import *
from models import Annotation
import sync

def get_or_create_entity(json, case, group, user):
    created = False
    id = json.get('id', 0)
    entity_type = json.get('entity_type', '')
    attrs = json.get('attribute', [])

    if id and entity_type:
        entity = Entity.objects.filter(id=id, entity_type=entity_type).select_subclasses()
        if len(entity) > 0:
            obj = entity[0]
        else:
            obj = create_entity(json, user, case, group)
            created = True
    else:
        obj = create_entity(json, user, case, group)
        created = True

    fields = obj._meta.get_all_field_names()
    # add attributes to entity
    if not created:
        # if the entity already exists, reassign its attributes
        obj.attributes.clear()

    obj.name = json['name']
    obj.last_edited_by = user
    print attrs
    for attr in attrs:
        if attr in fields:
            # set field value
            if entity_type == 'location' and attr == 'geometry': # special field
                location = attrs[attr]
                try:
                    geometry = fromstr('POINT(%s %s)' %(location[0], location[1]))  # longitude comes first
                    obj.geometry = geometry
                except:
                    print 'Warning: geometry format unrecognized, ', wkt
            else: # normal field such as char and int
                if attrs[attr] == '': attrs[attr] = None
                else:
                    try:
                        if attr == 'date':
                            attrs[attr] = parse_date(attrs[attr])
                        attrs[attr] = float(attrs[attr])
                    except:
                        pass

                setattr(obj, attr, attrs[attr])
        else:
            attribute, created = Attribute.objects.get_or_create(attr=attr, val=attrs[attr])
            obj.attributes.add(attribute)

    obj.save()

    operation = 'created' if created else 'updated'
    serverlog({
        'user': user,
        'operation': operation,
        'item': obj.entity_type,
        'tool': 'dataentry_table',
        'data': {
            'id': obj.id,
            'name': obj.name
        },
        'public': True,
        'case': case,
        'group': group
    })

    return obj, created


def create_entity(json, user, case, group):
    name = json['name']

    if name:
        entity_type = json['entity_type']
        if entity_type == 'person':
            obj, created = Person.objects.get_or_create(name=name, created_by=user, case=case, group=group)
        if entity_type == 'location':
            obj, created = Location.objects.get_or_create(name=name, created_by=user, case=case, group=group)
        if entity_type == 'event':
            obj, created = Event.objects.get_or_create(name=name, created_by=user, case=case, group=group)
        if entity_type == 'resource':
            obj, created = Resource.objects.get_or_create(name=name, created_by=user, case=case, group=group)
        if entity_type == 'organization':
            obj, created = Organization.objects.get_or_create(name=name, created_by=user, case=case, group=group)

        return obj

    else:
        return None


@login_required
def annotation(request, id=0):
    res = {}
    if request.method == 'POST':
        # create new annotation
        data = json.loads(request.body)
        ranges = data.get('ranges', '')
        quote  = data.get('quote', '')
        case   = data.get('case', '')
        group   = data.get('group', '')
        if not ranges or not case or not group:
            return HttpResponseBadRequest()
        try:
            entry = DataEntry.objects.get(id=data['anchor'])
            group = Group.objects.get(id=group)
            case = Case.objects.get(id=case)
        except DataEntry.DoesNotExist:
            return HttpResponseNotFound()
        else:
            relationships = []
            entity, created = get_or_create_entity(data['tag'], case, group, request.user)
            rel, created = Relationship.objects.get_or_create(
                target=entity,
                dataentry=entry,
                relation='contain',
                created_by=request.user,
                last_edited_by=request.user,
                group=group,
                case=case
            )
            # set relationship date to event date
            if entity.entity_type == 'event':
                rel.date = entity.date
                rel.save()
            relationships.append(rel.get_attr())
            related_entities = []
            related_relationships = []
            related_entities_id = data.get('related_entities', [])

            for ent in related_entities_id:
                ent = Entity.objects.get(id=ent)
                r, created = Relationship.objects.get_or_create(
                    source=entity,
                    target=ent,
                    dataentry=entry,
                    relation='involve',
                    created_by=request.user,
                    last_edited_by=request.user,
                    group=group,
                    case=case
                )
                if entity.entity_type == 'event':
                    r.date = entity.date
                    r.save()
                related_relationships.append(r)
                relationships.append(r.get_attr())
                related_entities.append(ent)

                serverlog({
                    'user': request.user,
                    'operation': 'created',
                    'item': 'relationship',
                    'tool': 'dataentry_table',
                    'data': {
                        'id': r.id,
                        'name': r.relation,
                        'source': entity.name,
                        'target': ent.name
                    },
                    'group': group,
                    'case': case
                })

            annotation = Annotation.objects.create(
                startOffset=ranges[0]['startOffset'],
                endOffset=ranges[0]['endOffset'],
                quote=quote,
                dataentry=entry,
                entity = entity,
                relationship=rel,
                start=ranges[0]['start'],
                end=ranges[0]['end'],
                created_by=request.user,
                last_edited_by=request.user,
                group=group,
                case=case
            )
            annotation.related_entities = related_entities
            annotation.related_relationships = related_relationships
            annotation.save()
            res['annotation'] = annotation.serialize()
            res['relationship'] = relationships
            res['entity'] = entity.get_attr()

            # save to activity log
            serverlog({
                'user': request.user,
                'operation': 'created',
                'item': 'annotation',
                'tool': 'dataentry_table',
                'data': {
                    'id': annotation.id,
                    'name': annotation.quote
                },
                'group': group,
                'case': case
            })
            # sync annotation
            sync.views.annotation_create(res, case, group, request.user)

            return HttpResponse(json.dumps(res), content_type='application/json')

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
                entry = annotation.dataentry
                old_entity = annotation.entity
                case = Case.objects.get(id=data['case'])
                group = Group.objects.get(id=data['group'])
                relationships = []

                entity, created = get_or_create_entity(data['tag'], case, group, request.user)

                if old_entity.id != entity.id:
                    # entity changed
                    relationship = Relationship.objects.get(
                        target=annotation.entity,
                        dataentry=annotation.dataentry,
                        relation='contain',
                        case=case,
                        group=group
                    )
                    relationship.target = entity
                    if entity.entity_type == 'event':
                        relationship.date = entity.date
                    relationship.save()
                    annotation.entity = entity
                    annotation.relationship = relationship
                    annotation.last_edited_by = request.user
                    annotation.save()
                    relationships.append(relationship.get_attr())

                # update related entities and related relationships
                # first delete entities and relationships not in the post data
                related_entities_id = data.get('related_entities', [])
                to_remove_entities = annotation.related_entities.exclude(id__in=related_entities_id)
                for e in to_remove_entities:
                    annotation.related_entities.remove(e)
                annotation.related_relationships.filter(target__in=to_remove_entities).delete()
                # then add entities and relationships new in the post data
                old_related_entities_id = annotation.related_entities.all().values('id')
                to_add = [id for id in related_entities_id if id not in old_related_entities_id]
                to_add_entities = Entity.objects.filter(id__in=to_add)
                for e in to_add_entities:
                    annotation.related_entities.add(e)
                for e in to_add_entities:
                    r, created = Relationship.objects.get_or_create(
                        source=entity,
                        target=e,
                        dataentry=entry,
                        relation='involve',
                        created_by=request.user,
                        last_edited_by=request.user,
                        group=group,
                        case=case
                    )
                    if entity.entity_type == 'event':
                        r.date = entity.date
                        r.save()
                    relationships.append(r.get_attr())
                    annotation.related_relationships.add(r)

                res['annotation'] = annotation.serialize()
                res['entity'] = entity.get_attr()

                serverlog({
                    'user': request.user,
                    'operation': 'updated',
                    'item': 'annotation',
                    'tool': 'dataentry_table',
                    'data': {
                        'id': annotation.id,
                        'name': annotation.quote
                    },
                    'group': group,
                    'case': case
                })
                sync.views.annotation_update(res, case, group, request.user)

                return HttpResponse(json.dumps(res), content_type='application/json')
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
                group = annotation.group
                case = annotation.case
                relationship = annotation.relationship
                res['entity'] = annotation.entity.get_attr()
                res['relationship'] = relationship.get_attr()
                res['annotation'] = annotation.serialize()
                annotation.related_relationships.all().delete()
                annotation.delete()
                relationship.delete()

                serverlog({
                    'user': request.user,
                    'operation': 'deleted',
                    'item': 'annotation',
                    'tool': 'dataentry_table',
                    'data': {
                        'id': annotation.id,
                        'name': annotation.quote
                    },
                    'case': case,
                    'group': group
                })

                sync.views.annotation_delete(res, case, group, request.user)

                return HttpResponse(json.dumps(res), content_type='application/json')
        else:
            return HttpResponseBadRequest()

    else:
        return HttpResponseBadRequest()


def annotations(request):
    if request.method == 'GET':
        case = request.GET.get('case')
        group = request.GET.get('group')
        annotations = []
        # if request.user.is_authenticated():
        #     anns = Annotation.objects.filter(created_by=request.user)
        # else:
        anns = Annotation.objects.filter(case__id=case, group__id=group)

        for ann in anns:
            annotations.append(ann.serialize())
        return HttpResponse(json.dumps(annotations), content_type='application/json')

    elif request.method == 'POST':
        res = {'annotations': [], 'entity': {}, 'relationships': []};
        data = json.loads(request.body)

        case = Case.objects.get(id=data['case'])
        group = Group.objects.get(id=data['group'])
        # all annotations are with the same entity
        entity, created = get_or_create_entity(data['annotations'][0]['tag'], case, group, request.user)
        quote = ''
        for ann in data['annotations']:
            ranges = ann.get('ranges', '')
            quote = ann.get('quote', '')
            if not ranges:
                return HttpResponseBadRequest()
            try:
                entry = DataEntry.objects.get(id=ann['anchor'])
            except DataEntry.DoesNotExist:
                return HttpResponseNotFound()
            else:
                relationship, created = Relationship.objects.get_or_create(
                    target=entity,
                    dataentry=entry,
                    date=entry.date,
                    relation='contain',
                    created_by=request.user,
                    case=case,
                    group=group
                )
                annotation = Annotation.objects.create(
                    startOffset=ranges[0]['startOffset'],
                    endOffset=ranges[0]['endOffset'],
                    quote=quote,
                    dataentry=entry,
                    entity=entity,
                    annotation=annotation,
                    start=ranges[0]['start'],
                    end=ranges[0]['end'],
                    created_by=request.user,
                    last_edited_by=request.user,
                    case=case,
                    group=group
                )
                res['annotations'].append(annotation.serialize())
                res['relationships'].append(relationship.get_attr())
        res['entity'] = entity.get_attr()

        serverlog({
            'user': request.user,
            'operation': 'created',
            'item': str(len(data)) + 'annotations',
            'tool': 'dataentry_table',
            'data': {
                'id': ','.join([str(ann['id']) for ann in res['annotations']]),
                'name': quote
            },
            'case': case,
            'group': group
        })
        # sync annotation
        sync.views.annotation_create(res, case, group, request.user)

        return HttpResponse(json.dumps(res), content_type='application/json')

    elif request.method == 'PUT':
        # update annotations
        res = {'annotations': [], 'entity': {}, 'relationships': []};
        data = json.loads(request.body)
        case = Case.objects.get(id=data['case'])
        group = Group.objects.get(id=data['group'])
        entity = None
        for ann in data['annotations']:
            try:
                annotation = Annotation.objects.get(id=ann['id'], case=case, group=group)
            except Annotation.DoesNotExist:
                print 'Error: annotation not found: ', ann
                return HttpResponseNotFound()
            else:
                tag = ann['tag']
                entity, created = get_or_create_entity(tag, case, group, request.user)
                entry = annotation.dataentry
                old_entity = annotation.entity

                if old_entity.id != entity.id:
                    # entity changed
                    relationship = annotation.relationship
                    relationship.target = entity
                    relationship.save()
                    res['relationships'].append(relationship.get_attr())

                    annotation.entity = entity
                    annotation.relationshiop = relationship
                    annotation.last_edited_by = request.user
                    annotation.save()
                    res['annotations'].append(annotation.serialize())

        res['entity'] = entity.get_attr()

        serverlog({
            'user': request.user,
            'operation': 'updated',
            'item': str(len(data)) + 'annotations',
            'tool': 'dataentry_table',
            'data': {
                'id': ','.join([str(ann['id']) for ann in res['annotations']]),
                'name': data['annotations'][0]['quote']
            },
            'group': group,
            'case': case
        })

        sync.views.annotation_update(res, case, group, request.user)

        return HttpResponse(json.dumps(res), content_type='application/json')

    elif request.method == 'DELETE':
        res = {'annotations': [], 'entity': {}, 'relationships': []};
        data = json.loads(request.body)
        case = Case.objects.get(id=data['case'])
        group = Group.objects.get(id=data['group'])
        for ann in data['annotations']:
            try:
                annotation = Annotation.objects.get(id=ann['id'], case=case, group=group)
            except Annotation.DoesNotExist:
                print 'Error: annotation not found: ', ann
            else:
                res['entity'] = annotation.entity.get_attr()
                relationship = annotation.relationship
                res['relationships'].append(relationship.get_attr())
                res['annotations'].append(annotation.serialize())
                annotation.delete()
                relationship.delete()

        serverlog({
            'user': request.user,
            'operation': 'deleted',
            'item': str(len(data)) + 'annotations',
            'tool': 'dataentry_table',
            'data': {
                'id': ','.join([str(ann['id']) for ann in res['annotations']]),
                'name': data['annotations'][0]['quote']
            },
            'case': case,
            'group': group
        })

        sync.views.annotation_delete(res, case, group, request.user)

        return HttpResponse(json.dumps(res), content_type='application/json')


# # deprecated
# def get_or_create_annotation(request):
#     if request.method == 'GET':
#         annotations = []
#         if request.user.is_authenticated():
#             anns = Annotation.objects.filter(created_by=request.user)
#         else:
#             anns = Annotation.objects.all()
#
#         for ann in anns:
#             annotations.append(ann.serialize())
#         return HttpResponse(json.dumps(annotations), content_type='application/json')
#     if request.method == 'POST':
#         res = None
#         data = json.loads(request.body)
#
#         if isinstance(data, list):
#             res = {'annotations': [], 'entity': {}, 'relationships': []};
#
#             for d in data:
#                 ann = create_annotation(request, d)
#                 r = save_annotation(request, ann, d)
#                 res['annotations'].append(r['annotation'])
#                 res['entity'] = r['entity']
#                 res['relationships'].append(r['relationship'])
#
#             log = {}
#             log['operation'] = 'add annotations'
#             annotations_id = []
#             for d in res['annotations']:
#                 annotations_id.append(d['id'])
#             log['data'] = json.dumps({'annotations_id': annotations_id})
#             serverlog(request, log)
#
#         elif isinstance(data, dict):
#             res = {}
#             ann = create_annotation(request, data)
#             res = save_annotation(request, ann, data)
#             log = {}
#             log['operation'] = 'add annotation'
#             log['data'] = json.dumps({'annotation_id': res['annotation']['id']})
#             serverlog(request, log)
#         return HttpResponse(json.dumps(res), content_type='application/json')
#     if request.method == 'DELETE':
#         res = {}
#         data = json.loads(request.body)
#         for d in data:
#             try:
#                 ann = Annotation.objects.get(id=d['id'])
#             except Annotation.DoesNotExist:
#                 print 'Delete annotation failed: annotation id %s does not exist' % d['id']
#                 return HttpResponseNotFound()
#             else:
#                 ann.delete()
#         return HttpResponse(json.dumps(res), content_type='application/json')
#
#
# # deprecated
# def create_annotation(request, data):
#     ranges = data.get('ranges', [])
#     anchor = data.get('anchor', '0')
#     quote  = data.get('quote', '')
#
#     if len(ranges) == 0 or quote == '' or 'startOffset' not in ranges[0] or 'endOffset' not in ranges[0] or anchor == '0':
#         print "error: no tag received"
#         print ranges, anchor, quote
#         return
#
#     entry = None
#     try:
#         entry = DataEntry.objects.get(id=anchor)
#     except DataEntry.DoesNotExist:
#         print "Error: data entry not exist for ID: ", anchor
#         return
#     else:
#         user = None
#         if request.user.is_authenticated():
#             user = request.user
#         annotation = Annotation.objects.create(startOffset=ranges[0]['startOffset'],
#             endOffset=ranges[0]['endOffset'],
#             dataentry=entry,
#             start=ranges[0]['start'],
#             end=ranges[0]['end'],
#             created_by=user
#         )
#         return annotation
#
#
# # deprecated
# def save_annotation(request, annotation, data):
#     res = {'annotation': {}, 'entity': {}, 'relationship': {}}
#     tag  = data['tag']
#     name = tag['name']
#
#     if name:
#         entity_type = tag['entity_type']
#         if entity_type == 'person':
#             obj, created = Person.objects.get_or_create(name=name)
#         if entity_type == 'location':
#             obj, created = Location.objects.get_or_create(name=name)
#         if entity_type == 'event':
#             obj, created = Event.objects.get_or_create(name=name)
#         if entity_type == 'resource':
#             obj, created = Resource.objects.get_or_create(name=name)
#         if entity_type == 'organization':
#             obj, created = Organization.objects.get_or_create(name=name)
#
#         # remove all attribute relations first
#         if not created:
#             obj.attributes.clear()
#         for attr in tag['attribute']:
#             fields = obj._meta.get_all_field_names()
#             if attr in fields:
#                 if entity_type == 'location' and attr == 'geometry':
#                     wkt = tag['attribute'][attr]
#                     try:
#                         geometry = fromstr(wkt)
#                         obj.geometry = geometry
#                     except:
#                         print 'Warning: geometry format unrecognized, ', wkt
#                 else:
#                     setattr(obj, attr, tag['attribute'][attr])
#             else:
#                 attribute, created = Attribute.objects.get_or_create(attr=attr, val=tag['attribute'][attr])
#                 obj.attributes.add(attribute)
#         obj.save()
#
#         annotation.entity = obj
#         res['entity'] = obj.get_attr()
#         # add to relationship
#         rel, created = Relationship.objects.get_or_create(source=None, target=obj, dataentry=annotation.dataentry, case=case, group=group)
#         if created:
#             rel.relation = 'contain'
#             rel.date = annotation.dataentry.date
#             rel.created_by = annotation.created_by
#             rel.save()
#         res['relationship'] = rel.get_attr()
#
#     annotation.save()
#
#     res['annotation'] = annotation.serialize()
#
#     return res
#
#
# # deprecated
# def process_annotation(request, id):
#     res = {}
#     if request.method == 'DELETE':
#         try:
#             ann = Annotation.objects.get(id=id)
#         except Annotation.DoesNotExist:
#             print 'Delete annotation failed: annotation id %s does not exist' % id
#             return HttpResponseNotFound()
#         else:
#             ann.delete()
#             return HttpResponse(json.dumps(res), content_type='application/json')
#     if request.method == 'PUT':
#         try:
#             ann = Annotation.objects.get(id=id)
#         except Annotation.DoesNotExist:
#             print 'Update annotation failed: annotation id %s does not exist' % id
#         else:
#             # remove entity relation first
#             ann.entity = None
#             data = json.loads(request.body)
#
#             res = save_annotation(request, ann, data)
#
#         return HttpResponse(json.dumps(res), content_type='application/json')
#
#
# # deprecated
# def tag(request):
#     res = {}
#     # Edit tag semantics
#     if request.method == 'POST':
#         uid = request.POST.get('uid', 0)
#         uid = int(uid)
#         if uid == 0:
#             return
#
#         entity = Entity.objects.filter(id=uid).select_subclasses()[0]
#
#         for attr in request.POST:
#             setattr(entity, attr, request.POST[attr])
#         entity.save()
#
#         res = entity.getKeyAttr()
#
#         return HttpResponse(json.dumps(res), content_type='application/json')
