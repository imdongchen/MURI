# Create your views here.
from django.http import HttpResponse
import json

from models import *

def activitylog(request):
    res = {}
    if request.method == 'POST':
        log = {
            'operation': request.POST['operation'],
            'data'    : request.POST['data']
        }
        serverlog(request, log)
        return HttpResponse(json.dumps(res), mimetype='application/json')
    if request.method == 'GET':
        pass

def serverlog(request, log):
    res = {}
    if request.user.is_authenticated():
        activity = Activity.objects.create(
            user = request.user,
            operation = log['operation'],
            data = log['data']
        )
    else:
        activity = Activity.objects.create(
            operation = log['operation'],
            data = log['data']
        )
    activity.save()
    return res
