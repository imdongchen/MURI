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
	tags = data.get('annotations',[])
	name = data.get('quote', '')
	ranges = data.get('ranges', [])
	if len(ranges) == 0 or name == '' or len(tags) == 0:
	    res['error'] = 'Error: no tag received'
	    return HttpResponse(json.dumps(res), mimetype='application/json')
	for tag in tags:
	    if tag == 'person':
		obj, created = Person.objects.get_or_create(name=name)
	    if tag == 'person':
		obj, created = Person.objects.get_or_create(name=name)
	    if tag == 'person':
		obj, created = Person.objects.get_or_create(name=name)
	    if tag == 'person':
		obj, created = Person.objects.get_or_create(name=name)
	    if tag == 'person':
		obj, created = Person.objects.get_or_create(name=name)
	    if tag == 'person':
		obj, created = Person.objects.get_or_create(name=name)
	print data
	return HttpResponse(json.dumps({}), mimetype='application/json')

def process_annotation(request, id):
    return

