# Create your views here.
from dashboard.models import *
from models import Annotation
import json
from django.views.decorators.http import require_GET
from django.http import HttpResponse

def get_or_create_annotation(request):
    if request.method == 'GET':
	annotations = []
	anns = Annotation.objects.all()
	for ann in anns:
	    annotations.append(ann.serialize())
	return HttpResponse(json.dumps(annotations), mimetype='application/json')
    if request.method == 'POST':
	res = {}
	data = json.loads(request.body)
	tags = data.get('tags',[])
	ranges = data.get('ranges', [])
	anchor = data.get('anchor', '0')
	quote  = data.get('quote', '')
	print data
	if len(ranges) == 0 or quote == '' or 'startOffset' not in ranges[0] or 'endOffset' not in ranges[0] or len(tags) == 0 or anchor == '0':
	    res['error'] = 'Error: no tag received'
	    print "error: no tag received"
	    return HttpResponse(json.dumps(res), mimetype='application/json')
	message = None
	try:
	    message = Message.objects.get(id=anchor)
	except Message.DoesNotExist:
	    print "Error: message not exist for ID: ", anchor
	    return
	else: 
	    res['tags'] = [] 
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
		annotation = Annotation.objects.create(startOffset=ranges[0]['startOffset'], endOffset=ranges[0]['endOffset'], message=message, start=ranges[0]['start'], end=ranges[0]['end'])
		annotation.entities.add(obj)
		annotation.save()
		res['tags'].append(obj.getKeyAttr())
		res['id'] = annotation.id
	return HttpResponse(json.dumps(res), mimetype='application/json')

def process_annotation(request, id):
    return

def tag(request):
    res = {}
    # Edit tag semantics
    if request.method == 'POST': 
	print request.POST
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
    return

