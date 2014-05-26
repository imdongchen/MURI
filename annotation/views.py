# Create your views here.
from dashboard.models import *
from models import Annotation
import json
from django.views.decorators.http import require_GET
from django.http import HttpResponse
from django.contrib.gis.geos import fromstr
from django.http import QueryDict
from activitylog.views import serverlog

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
            print 'get a list of annotations'
            res = []
            for d in data:
                res.append(save_annotation(request, d))

            log = {}
            log['operation'] = 'add annotations'
            annotations_id = []
            for d in res:
                annotations_id.append(d['id'])
            log['data'] = json.dumps({'annotations_id': annotations_id})
            serverlog(request, log)

        elif isinstance(data, dict):
            print 'get one annotation'
            res = {}
            res = save_annotation(request, data)
            log = {}
            log['operation'] = 'add annotation'
            log['data'] = json.dumps({'annotation_id': res['id']})
            serverlog(request, log)
        return HttpResponse(json.dumps(res), mimetype='application/json')


def save_annotation(request, data):
    res = {}

    tags = data.get('tags',[])
    ranges = data.get('ranges', [])
    anchor = data.get('anchor', '0')
    quote  = data.get('quote', '')

    if len(ranges) == 0 or quote == '' or 'startOffset' not in ranges[0] or 'endOffset' not in ranges[0] or len(tags) == 0 or anchor == '0':
        res['error'] = 'Error: no tag received'
        print "error: no tag received"
        print tags, ranges, anchor, quote
        return res

    message = None
    try:
        message = Message.objects.get(id=anchor)
    except Message.DoesNotExist:
        print "Error: message not exist for ID: ", anchor
        return
    else:
        res['tags'] = []

        user = None
        if request.user.is_authenticated():
            user = request.user
        annotation = Annotation.objects.create(startOffset=ranges[0]['startOffset'],
            endOffset=ranges[0]['endOffset'],
            message=message,
            start=ranges[0]['start'],
            end=ranges[0]['end'],
            created_by=user
        )

        for tag in tags:
            obj = None
            if tag['entity'] == 'person':
                obj, created = Person.objects.get_or_create(name=quote)
            if tag['entity'] == 'location':
                obj, created = Location.objects.get_or_create(name=quote)
            if tag['entity'] == 'event':
                obj, created = Event.objects.get_or_create(name=quote)
            if tag['entity'] == 'resource':
                obj, created = Resource.objects.get_or_create(name=quote)
            if tag['entity'] == 'organization':
                obj, created = Organization.objects.get_or_create(name=quote)
            for attr in tag:
                if attr != 'entity':
                    fields = obj._meta.get_all_field_names()
                    if attr in fields:
                        if tag['entity'] == 'location' and attr == 'location':
                            latlon = tag[attr].split(',')
                            location = fromstr('POINT(%s %s)' % (latlon[1], latlon[0]))
                            obj.location = location
                        else:
                            setattr(obj,attr, tag[attr])
                    else:
                        attribute, created_attr = Attribute.objects.get_or_create(attr=attr, val=tag[attr])
                        obj.attributes.add(attribute)
            obj.save()

            annotation.entities.add(obj)
            res['tags'].append(obj.getKeyAttr())
        annotation.save()
        res['id'] = annotation.id
        return res

def process_annotation(request, id):
    res = {}
    if request.method == 'DELETE':
        try:
            ann = Annotation.objects.get(id=id)
        except ObjectDoesNotExist:
            print 'Delete annotation failed: annotation id %s does not exist' % id
            return HttpResponseNotFound()
        else:
            ann.delete()
            return HttpResponse(json.dumps(res), mimetype='application/json')
    if request.method == 'PUT':
        try:
            ann = Annotation.objects.get(id=id)
        except ObjectDoesNotExist:
            print 'Delete annotation failed: annotation id %s does not exist' % id
        else:
            # remove all entity relations first
            ann.entities.clear()

            data = json.loads(request.body)
            res = save_annotation(request, data)
        #     quote  = data.get('quote', '')
        #     tags = data.get('tags',[])
        #     res['tags'] = []
        #     for tag in tags:
        #         obj = None
        #         if tag['entity'] == 'person':
        #             obj, created = Person.objects.get_or_create(name=quote)
        #         if tag['entity'] == 'location':
        #             obj, created = Location.objects.get_or_create(name=quote)
        #         if tag['entity'] == 'event':
        #             obj, created = Event.objects.get_or_create(name=quote)
        #         if tag['entity'] == 'resource':
        #             obj, created = Resource.objects.get_or_create(name=quote)
        #         if tag['entity'] == 'organization':
        #             obj, created = Organization.objects.get_or_create(name=quote)
        #
        #         # remove all attribute relations first
        #         obj.attributes.clear()
        #         fields = obj._meta.get_all_field_names()
        #
        #         for attr in tag:
        #             if attr != 'entity':
        #                 fields = obj._meta.get_all_field_names()
        #                 if attr in fields:
        #                     if tag['entity'] == 'location' and attr == 'location':
        #                         latlon = tag[attr].split(',')
        #                         location = fromstr('POINT(%s %s)' % (latlon[1], latlon[0]))
        #                         obj.location = location
        #                     else:
        #                         setattr(obj, attr, tag[attr])
        #                 else:
        #                     attribute, created_attr = Attribute.objects.get_or_create(attr=attr, val=tag[attr])
        #                     obj.attributes.add(attribute)
        #         obj.save()
        #
        #         ann.entities.add(obj)
        #         res['tags'].append(obj.getKeyAttr())
        #     ann.save()
        #     res['id'] = ann.id
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
