# Create your views here.
from dashboard.models import *
import json
from django.views.decorators.http import require_GET
from django.http import HttpResponse

def get_or_create_annotation(request):
    if request.method == 'GET':
	return HttpResponse(json.dumps({}), mimetype='application/json')
    if request.method == 'POST':
	res = {}
	data = json.loads(request.body)
	print data
	tags = data.get('annotations',[])
	name = data.get('quote', '')
	ranges = data.get('ranges', [])
	anchor = data.get('anchor_id', '0')
	if len(ranges) == 0 or name == '' or len(tags) == 0 or anchor == '0':
	    res['error'] = 'Error: no tag received'
	    return HttpResponse(json.dumps(res), mimetype='application/json')
	message = None
	try:
	    message = Message.objects.get(id=anchor)
	except Message.DoesNotExist:
	    print "Error: message not exist for ID: ", anchor
	    return
	else: 
	    for tag in tags:
		tag = tag.lower()
		obj = None
		if tag == 'person':
		    obj, created = Person.objects.get_or_create(name=name)
		if tag == 'location':
		    obj, created = Location.objects.get_or_create(name=name)
		if tag == 'event':
		    obj, created = Event.objects.get_or_create(name=name)
		if tag == 'resource':
		    obj, created = Resource.objects.get_or_create(name=name)
		if tag == 'organization':
		    obj, created = Organization.objects.get_or_create(name=name)
		TagInMessage.objects.create(tag=obj,message=message)
	return HttpResponse(json.dumps({}), mimetype='application/json')

def process_annotation(request, id):
    return

