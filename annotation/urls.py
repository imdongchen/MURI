from django.conf.urls import patterns, include, url
from views import *

urlpatterns = patterns('',
    # Examples:
    url(r'^annotations$', get_or_create_annotation),
    url(r'^annotations/(\d+)$', process_annotation),
    url(r'^annotation/tag$', tag),
)

