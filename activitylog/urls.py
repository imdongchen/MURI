from django.conf.urls import patterns, include, url

from views import *

urlpatterns = patterns('',
    # Examples:
    url(r'^activitylog$', activitylog),
)
