from django.conf.urls import patterns, include, url
from views import *

urlpatterns = patterns('',
    # Examples:
    url(r'^login$', login),
    url(r'^register$', register),
    url(r'^logout$', logout),
)

