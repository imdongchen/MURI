# Create your views here.
from django.http import HttpResponse
from django.contrib.auth.models import User, Group

from django.contrib.auth.decorators import login_required

from drealtime import iShoutClient
import json

from dashboard.models import Case
from models import Message


ishout_client = iShoutClient()


def live_group(case, group):
    """return the live group"""
    return (case.name + '-' + group.name).replace(' ', '')



def register_group(case, group, user):
    group_name = live_group(case, group)
    print group_name
    ishout_client.register_group(user.id, group_name)


@login_required
def join_group(request):
    case = Case.objects.get(id=int(request.POST['case']))
    group = Group.objects.get(id=int(request.POST['group']))
    register_group(case, group, request.user)
    return HttpResponse('success')


def annotation_create(data, case, group, user):
    group_name = live_group(case, group)
    data['user']= user.id
    ishout_client.broadcast_group(group_name, 'annotation.create', data)


def annotation_update(data, case, group, user):
    group_name = live_group(case, group)
    data['user']= user.id
    ishout_client.broadcast_group(group_name, 'annotation.update', data)


def annotation_delete(data, case, group, user):
    group_name = live_group(case, group)
    data['user']= user.id
    ishout_client.broadcast_group(group_name, 'annotation.delete', data)


@login_required
def entity_create(entity):
    res = 'error'
    ishout_client.broadcast('entity.create', entity.get_attr())

    return HttpResponse(res)


@login_required
def entity_update(request):
    res = 'error'
    return HttpResponse(res)


@login_required
def entity_delete(request):
    res = 'error'
    return HttpResponse(res)


def relationship_create(data, case, group, user):
    group_name = live_group(case, group)
    data['user']= user.id
    ishout_client.broadcast_group(group_name, 'relationship.create', data)


def relationship_update(data, case, group, user):
    group_name = live_group(case, group)
    data['user']= user.id
    ishout_client.broadcast_group(group_name, 'relationship.update', data)


def relationship_delete(data, case, group, user):
    group_name = live_group(case, group)
    data['user']= user.id
    ishout_client.broadcast_group(group_name, 'relationship.delete', data)


@login_required
def get_messages(request):
    group = request.GET['group']
    case  = request.GET['case']
    msgs = Message.objects.filter(group=group, case=case).order_by('sent_at')
    res = [msg.tojson() for msg in msgs]
    return HttpResponse(json.dumps(res), content_type='application/json')

@login_required
def message_broadcast(request):
    res = 'error'
    content = request.POST.get('content')
    case = request.POST.get('case')
    group = request.POST.get('group')
    case = Case.objects.get(id=int(case))
    group = Group.objects.get(id=int(group))
    group_name = live_group(case, group)
    sender = request.user
    msg = Message(sender=sender, content=content, group=gorup, case=case)
    msg.save()
    ishout_client.broadcast_group(group_name, 'message', msg.tojson())
    res = 'success'
    return HttpResponse(res)


@login_required
def message_togroup(request):
    pass

@login_required
def message_to(request):
    pass

@login_required
def get_userlist(request):
    case = Case.objects.get(id=int(request.GET['case']))
    group = Group.objects.get(id=int(request.GET['group']))
    register_group(case, group, request.user)
    send_userlist(case, group, request.user)
    return HttpResponse('Refreshing user list...')


def send_userlist(case, group):
    group_name = live_group(case, group)
    room_status = ishout_client.get_room_status(group_name) # todo: avoid hardcoded room name
    users = User.objects.filter(id__in=room_status['members'])
    user_info = [user.id for user in users]

    ishout_client.broadcast_group(group_name, 'userlist', user_info)


def broadcast_activity(data, case, group, user):
    group_name = live_group(case, group)
    ishout_client.broadcast_group(group, 'activitylog', data)

