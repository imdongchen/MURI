from django.conf.urls import patterns, url
from views import *

urlpatterns = patterns('',
    # Examples:
    url(r'annotation/create', annotation_create),
    url(r'annotation/update', annotation_update),
    url(r'annotation/delete', annotation_delete),
    url(r'entity/create', entity_create),
    url(r'entity/update', entity_update),
    url(r'entity/delete', entity_delete),
    url(r'relationhip/create', relationship_create),
    url(r'relationhip/update', relationship_update),
    url(r'relationhip/delete', relationship_delete),
    url(r'message/broadcast', message_broadcast),
    url(r'message/togroup', message_togroup),
    url(r'message/to', message_to),
    url(r'message/all', message_all),
    url(r'userlist', get_userlist),
)
