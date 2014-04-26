# Create your views here.
from django.http import HttpResponse
import json

from models import *

def activitylog(request):
    res = {}
    if request.method == 'POST':
	activity = Activity.objects.create(
	    user = request.user,
	    operation = request.POST['operation'],
	    data = request.POST['data']
	)
	activity.save()
	return HttpResponse(json.dumps(res), mimetype='application/json')
    if request.method == 'GET':
	pass

