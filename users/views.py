from django.contrib.auth import login as auth_login, authenticate, logout as auth_logout
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.http import HttpResponse
from django.core.urlresolvers import reverse

import json

# Create your views here.
def login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '')
        psd   = request.POST.get('password', '')
        if username and psd:
            user = authenticate(username=username, password=psd)
            if user:
                auth_login(request, user)
                return redirect('dashboard.views.index')
        return HttpResponse('Log in failed: user name and password do not match!<a href="'+ reverse('dashboard.views.index')+'">Try again</a>')
    return

def register(request):
    if request.method == 'POST':
        username = request.POST.get('username', '')
        email = request.POST.get('email', '')
        psd   = request.POST.get('password', '')
    if username and email and psd:
        if User.objects.filter(username=username).exists():
            user = authenticate(username=username, password=psd)
            if user:
                auth_login(request, user)
                return redirect('dashboard.views.index')
            else:
                return HttpResponse('Error: username and password do not match')
        else:
            User.objects.create_user(username=username, email=email, password=psd)
            user = authenticate(username=username, password=psd)
            auth_login(request, user)
            return redirect('dashboard.views.index')

    return

def logout(request):
    auth_logout(request)
    return redirect('dashboard.views.index')


def get_all_users(request):
    users = User.objects.all()
    user_info = []
    for user in users:
        user_info.append({
            'id': user.id,
            'name': user.username
        })
    return HttpResponse(json.dumps(user_info), content_type="application/json")

