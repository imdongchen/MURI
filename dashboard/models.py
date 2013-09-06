from django.contrib.gis.db import models

# Create your models here.
class Entity(models.Model):
    name          = models.CharField(max_length=100, null=True)
    security_info = models.CharField(max_length=50, null=True)
    date_as_of    = models.DateTimeField(null=True)
    date_first_info    = models.DateTimeField(null=True)
    affiliation   = models.CharField(max_length=100, null=True)
    allegiance    = models.CharField(max_length=50, null=True)
    intelligence_evaluation = models.CharField(max_length=20, null=True)
    guid          = models.CharField(max_length=50, null=True)
    description   = models.CharField(max_length=500, null=True)
    date_begin    = models.DateTimeField(null=True)
    date_end      = models.DateTimeField(null=True)

class Footprint(Entity):
    location = models.GeometryField(null=True)
    imprecision = models.FloatField(null=True)

    objects = models.GeoManager()

    def _get_geom_type(self):
        return self.location.geom_type
    def __unicode__(self):
        return self.name


class Person(Entity):
    first_name   = models.CharField(max_length=50, null=True)
    middle_name  = models.CharField(max_length=50, null=True)
    last_name    = models.CharField(max_length=50, null=True)
    prefix       = models.CharField(max_length=10, null=True)
    suffix       = models.CharField(max_length=10, null=True)
    primary_citizenship  = models.CharField(max_length=50, null=True)
    secondary_citizenship= models.CharField(max_length=50, null=True)
    nationality    = models.CharField(max_length=50, null=True)
    alias   = models.CharField(max_length=50, null=True)
    place_birth  = models.CharField(max_length=50, null=True)
    place_death  = models.CharField(max_length=50, null=True)
    ethnicity    = models.CharField(max_length=50, null=True)
    race         = models.CharField(max_length=10, null=True)
    gender       = models.CharField(max_length=10, null=True)
    marital_status = models.CharField(max_length=10, null=True)
    religion     = models.CharField(max_length=50, null=True)
    status       = models.CharField(max_length=10, null=True)

    def __unicode__(self):
        return self.name

class Organization(Entity):
    types    = models.CharField(max_length=100, null=True)
    nationality = models.CharField(max_length=50)
    ethnicity   = models.CharField(max_length=50, null=True)
    religion    = models.CharField(max_length=50, null=True)
    date_founded = models.DateTimeField(null=True)
    registratioin_country = models.CharField(max_length=50, null=True)
    registration_state    = models.CharField(max_length=50, null=True)

    def __unicode__(self):
        return self.name
    
class Facility(Entity):
    category    = models.CharField(max_length=30)
    desc        = models.CharField(max_length=100, null=True)
    remark    = models.CharField(max_length=100, null=True)

    def __unicode__(self):
        return self.category

class Event(Entity):
    types    = models.CharField(max_length=100, null=True)
    category = models.CharField(max_length=100, null=True)
    nationality= models.CharField(max_length=50, null=True)

    def __unicode__(self):
        return self.category


class Object(Entity):
    condition    = models.CharField(max_length=50, null=True)
    operational_status = models.CharField(max_length=50, null=True)
    availability = models.CharField(max_length=50, null=True)
    country      = models.CharField(max_length=50, null=True)

class Equipment(Object):
    pass

class Weapon(Object):
    make    = models.CharField(max_length=50, null=True)
    model   = models.CharField(max_length=50, null=True)
    equipment_code = models.CharField(max_length=50, null=True)

class Vehicle(Object):
    vin     = models.CharField(max_length=50, null=True)
    year    = models.CharField(max_length=10, null=True)
    make    = models.CharField(max_length=50, null=True)
    model   = models.CharField(max_length=50, null=True)
    license_number  = models.CharField(max_length=50, null=True)
    license_country = models.CharField(max_length=50, null=True)
    color   = models.CharField(max_length=50, null=True)
    category = models.CharField(max_length=50, null=True)
    usage   = models.CharField(max_length=100, null=True)
    fuel_type = models.CharField(max_length=50, null=True)

class Facility(Object):
    types     = models.CharField(max_length=100, null=True)
    primary_function = models.CharField(max_length=100, null=True)
    O_suffix  = models.CharField(max_length=50, null=True)
    BE_number = models.CharField(max_length=50, null=True)
    PIN       = models.CharField(max_length=50, null=True)

    class Meta:
        verbose_name_plural = "facilities"

class Document(Object):
    title   = models.CharField(max_length=100, null=True)
    title_short = models.CharField(max_length=100, null=True)
    author  = models.CharField(max_length=100, null=True)
    is_broken_link   = models.NullBooleanField(null=True)
    url   = models.URLField(max_length=100, null=True)
    language  = models.CharField(max_length=50, null=True)
    medium    = models.CharField(max_length=50, null=True)
    types     = models.CharField(max_length=50, null=True)
    date_approved  = models.CharField(max_length=50, null=True)

class Relationship(models.Model):
    source = models.ForeignKey(Entity, related_name="relates_as_source")
    target = models.ForeignKey(Entity, related_name="relates_as_target")
    description   = models.CharField(max_length=500, null=True)
    types  = models.CharField(max_length=100, null=True)
    frequency  = models.CharField(max_length=50, null=True)
    intelligence_evaluation  = models.CharField(max_length=20, null=True)
    date_begin  = models.DateTimeField(null=True)
    date_end    = models.DateTimeField(null=True)
    date_as_of  = models.DateTimeField(null=True)
    security_info  = models.CharField(max_length=50, null=True)
    guid  = models.CharField(max_length=50, null=True)



