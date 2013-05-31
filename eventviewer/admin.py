# from django.contrib import admin
from django.contrib.gis import admin 

from eventviewer.models import *

class GroupInfoAdmin(admin.ModelAdmin):
    pass

admin.site.register(GroupInfo, GroupInfoAdmin)
admin.site.register(Footprint, admin.GeoModelAdmin)
admin.site.register(Person)
admin.site.register(Facility)
