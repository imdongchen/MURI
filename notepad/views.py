# Create your views here.
from models import *
import json
from django.views.decorators.http import require_GET
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest


def note(request):
    res = {}
    if request.method == 'GET':
        if request.user.is_authenticated():
            note = None
            try:
                note = Note.objects.get(created_by=request.user)
            except Note.DoesNotExist:
                note = Note.objects.create(created_by=request.user) # if not exist, create one
                res['content'] = note.content
                res['id'] = note.id
                return HttpResponse(json.dumps(res), mimetype='application/json')
            else:
                res['content'] = note.content
                res['id'] = note.id
                return HttpResponse(json.dumps(res), mimetype='application/json')
        else:
            res['content'] = 'Please log in first before using the notepad!'
            return HttpResponse(json.dumps(res), mimetype='application/json')

    elif request.method == 'POST':
        if request.user.is_authenticated():
            try:
                note = Note.objects.get(created_by=request.user)
            except Note.DoesNotExist:
                note = Note.objects.create(created_by=request.user) # if not exist, create one
            else:
                content = request.POST.get('content', '')
                note.content = content
                note.save()
            finally:
                return HttpResponse('success')
        else:
            res['content'] = 'Please log in first before using the notepad!'
            return HttpResponse(json.dumps(res), mimetype='application/json')
    else:
        return HttpResponseBadRequest()
