# Create your views here.
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
import json

from models import *


@login_required
def get_logs(request):
    res = []
    case_id = request.GET.get('case')
    group_id = request.GET.get('group')
    case = Case.objects.get(id=case_id)
    activities = Activity.objects.filter(case__id=case_id, group__id=group_id, user=request.user, public=True)
    for act in activities:
        res.append({
            'user': act.user.id,
            'operation': act.operation,
            'item': act.item,
            'time': act.time.strftime('%m/%d/%Y-%H:%M:%S'),
            'data': act.data
        })

    return HttpResponse(json.dumps(res), content_type='application/json')


def activitylog(request):
    res = {}
    if request.method == 'POST':
        log = {
            'operation': request.POST['operation'],
            'item'     : request.POST['item'],
            'data'    : request.POST.get('data', None),
            'user'    : request.user,
            'group': request.POST['group'],
            'case': request.POST['case'],
            'public': request.POST.get('public', '')
        }
        serverlog(log)
        return HttpResponse(json.dumps(res), content_type='application/json')
    if request.method == 'GET':
        pass

def serverlog(log):
    if ('public' not in log) or (log['public'] == ''):
        log['public'] = True

    activity = Activity.objects.create(
        user = log['user'],
        operation = log['operation'],
        item = log['item'],
        data = json.dumps(log['data']),
        group = log['group'],
        case = log['case'],
        public = log['public']
    )
    activity.save()
