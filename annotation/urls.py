from django.conf.urls import patterns, include, url
from views import *

urlpatterns = patterns('',
    # Examples:
    url(r'^annotation/(\d+)$', annotation),
    url(r'^annotation$', annotation),
    url(r'^annotations$', annotations),
)
