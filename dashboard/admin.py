# from django.contrib import admin
from django.contrib.gis import admin 

from dashboard.models import *

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
    openlayers_url = "dashboard/lib/OpenLayers-2.12/OpenLayers.debug.js"

admin.site.register(Organization)
admin.site.register(Footprint, GoogleAdmin)
admin.site.register(Person)
admin.site.register(Facility)
admin.site.register(Document)
admin.site.register(Vehicle)
admin.site.register(Event)
admin.site.register(Equipment)
admin.site.register(Weapon)
admin.site.register(Relationship)
