from django.shortcuts import render
from models import *
from django.http import HttpResponse
import json

def index(request):
    return render(request, 'eventviewer/index.html')

def queryEvent(request):
    response = {}
    response['aaData'] = [] # this field name is required by client 
    events = EventInfo.objects.all().order_by('date')
    for event in events:
        try:
            record = [event.category, event.desc, event.date.strftime('%m/%d/%Y')]
        except:
            record = [event.category, event.desc, '']
        response['aaData'].append(record)

    return HttpResponse(json.dumps(response), mimetype='application/json')
