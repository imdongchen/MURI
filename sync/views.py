# Create your views here.
from django.http import HttpResponse, HttpResponseBadRequest
from django.contrib.auth.models import User

from django.contrib.auth.decorators import login_required

from drealtime import iShoutClient
import json

from models import Message


ishout_client = iShoutClient()


def annotation_create(data):
    ishout_client.broadcast('annotation.create', data)


@login_required
def annotation_update(request):
    res = 'error'
    return HttpResponse(res)


@login_required
def annotation_delete(request):
    res = 'error'
    return HttpResponse(res)


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


@login_required
def relationship_create(request):
    res = 'error'
    return HttpResponse(res)


@login_required
def relationship_update(request):
    res = 'error'
    return HttpResponse(res)


@login_required
def relationship_delete(request):
    res = 'error'
    return HttpResponse(res)


@login_required
def message_all(request):
    msgs = Message.objects.all().order_by('sent_at')
    res = [msg.tojson() for msg in msgs]
    return HttpResponse(json.dumps(res), mimetype='application/json')

@login_required
def message_broadcast(request):
    res = 'error'
    content = request.POST.get('content')
    sender = request.user
    msg = Message(sender=sender, content=content)
    msg.save()
    ishout_client.broadcast('message', msg.tojson())
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
    send_userlist()
    return HttpResponse('Refreshing user list...')


def send_userlist():
    room_status = ishout_client.get_room_status('main') # todo: avoid hardcoded room name
    print room_status
    users = User.objects.filter(id__in=room_status['members'])
    user_info = {}
    for user in users:
        user_info[user.id] = {
            'id': user.id,
            'name': user.username
        }

    ishout_client.broadcast('userlist', user_info)

