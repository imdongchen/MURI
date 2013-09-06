# from django.contrib import admin
from django.contrib.gis import admin 

from eventviewer.models import *

class GroupInfoAdmin(admin.ModelAdmin):
    pass

class GoogleAdmin(admin.OSMGeoAdmin):
#   extra_js = [GMAP.api_url + GMAP.key]
#   extra_js = "http://maps.google.com/maps/api/js?v=3&amp;sensor=false"
    extra_js = ["http://maps.google.com/maps/api/js?v=3&sensor=false"]
    map_template = 'admin/gmap.html'
    default_zoom = 12
    default_lon = 4940125.229787144
    default_lat = 3937156.670348139
    map_width = 800
    map_height = 600
    openlayers_url = "eventviewer/lib/OpenLayers-2.12/OpenLayers.debug.js"

admin.site.register(GroupInfo, GroupInfoAdmin)
admin.site.register(Footprint, GoogleAdmin)
admin.site.register(Person)
admin.site.register(Facility)
