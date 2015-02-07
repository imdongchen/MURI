# Create your views here.
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
import json

from django.contrib.auth.models import Group
from dashboard.models import Case
from models import Activity


@login_required
def get_logs(request):
    res = []
    case_id = request.GET.get('case')
    group_id = request.GET.get('group')
    activities = Activity.objects.filter(case__id=case_id, group__id=group_id, public=True).order_by('time')
    for act in activities:
        res.append(act.serialize())

    return HttpResponse(json.dumps(res), content_type='application/json')


def activitylog(request):
    res = {}
    if request.method == 'POST':
        group = Group.objects.get(id=request.POST['group'])
        case = Case.objects.get(id=request.POST['case'])
        data = json.loads(request.POST.get('data', '{}'))
        log = {
            'operation': request.POST['operation'],
            'item'     : request.POST['item'],
            'tool'     : request.POST['tool'],
            'data'    : data,
            'user'    : request.user,
            'group': group,
            'case': case,
            'public': request.POST.get('public', '')
        }
        serverlog(log)
        return HttpResponse(json.dumps(res), content_type='application/json')
    if request.method == 'GET':
        pass


def serverlog(log):
    if ('public' not in log) or (log['public'] == ''):
        log['public'] = True

    Activity.objects.create(
        user=log['user'],
        operation=log['operation'],
        item=log['item'],
        tool=log['tool'],
        data=json.dumps(log['data']),
        group=log['group'],
        case=log['case'],
        public=log['public']
    )
