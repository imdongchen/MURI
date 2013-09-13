from django.contrib.gis.db import models
from model_utils.managers import InheritanceManager

# Create your models here.
class Entity(models.Model):
    name          = models.CharField(max_length=100, null=True)
    security_info = models.CharField(max_length=50, null=True)
    date_as_of    = models.DateTimeField(null=True)
    date_first_info    = models.DateTimeField(null=True)
    affiliation   = models.CharField(max_length=100, null=True)
    allegiance    = models.CharField(max_length=50, null=True)
    intelligence_evaluation = models.CharField(max_length=50, null=True)
    guid          = models.CharField(max_length=50, null=True)
    description   = models.CharField(max_length=500, null=True)
    date_begin    = models.DateTimeField(null=True)
    date_end      = models.DateTimeField(null=True)

    objects = InheritanceManager()

    def __unicode__(self):
        return self.name
    
    def findTargets(self):
        res = []
        targets_id = list(Relationship.objects.filter(source=self).values_list("target"))
        for tar in targets_id:
            res.append(tar[0])
        return Entity.objects.filter(id__in=res).select_subclasses()

    def findSources(self):
        res = []
        sources_id = list(Relationship.objects.filter(target=self).values_list("source"))
        for sou in sources_id:
            res.append(sou[0])
        return Entity.objects.filter(id__in=res).select_subclasses()

class Footprint(Entity):
    shape = models.GeometryField(null=True)
    imprecision = models.FloatField(null=True)

    objects = models.GeoManager()

    def _get_geom_type(self):
        return self.location.geom_type

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['node'] = 'footprint'
        if self.shape:
            attr['shape'] = self.shape.wkt
            attr['srid'] = self.shape.srid
        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        attr['affiliation'] = self.affiliation
        attr['allegiance'] = self.allegiance
        attr['intelligence_evaluation'] = self.intelligence_evaluation
        return attr

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
    status       = models.CharField(max_length=50, null=True)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['gender'] = self.gender
        attr['race'] = self.race
        attr['nationality'] = self.nationality
        attr['node'] = 'person'
        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        attr['primary_citizenship'] = self.primary_citizenship
        attr['alias'] = self.alias
        attr['ethnicity'] = self.ethnicity
        attr['marital_status'] = self.marital_status
        attr['status'] = self.status
        return attr

class Organization(Entity):
    types    = models.CharField(max_length=100, null=True)
    nationality = models.CharField(max_length=50)
    ethnicity   = models.CharField(max_length=50, null=True)
    religion    = models.CharField(max_length=50, null=True)
    date_founded = models.DateTimeField(null=True)
    registration_country = models.CharField(max_length=50, null=True)
    registration_state    = models.CharField(max_length=50, null=True)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['types'] = self.types
        attr['node'] = 'organization'
        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        attr['nationality'] = self.nationality
        attr['ethnicity'] = self.ethnicity
        attr['religion'] = self.religion
        return attr

class Event(Entity):
    types    = models.CharField(max_length=100, null=True)
    category = models.CharField(max_length=100, null=True)
    nationality= models.CharField(max_length=50, null=True)
    purpose  = models.CharField(max_length=500, null=True)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['types'] = self.types
        attr['date']    = '' 
        if self.date_begin != None: 
            attr['date']  = self.date_begin.strftime('%m/%d/%Y') 
        messages = self.message_set.all()
        attr['excerpt'] = ''
        if len(messages) != 0:
            attr['excerpt'] = messages[0].content[:100] + "..." # get the first 100 characters in the first string
        attr['node'] = 'event'
        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        attr['nationality'] = self.nationality
        attr['intelligence_evaluation'] = self.intelligence_evaluation
        messages = self.message_set.all()
        if len(messages) != 0:
            attr['messages'] = [message for message in messages]
        return attr

class Message(models.Model):
    uid = models.CharField(max_length=10)
    content = models.CharField(max_length=1000)
    event = models.ManyToManyField(Event, null=True)

class Unit(Entity):
    unit_number    = models.CharField(max_length=50, null=True)
    unit_type    = models.CharField(max_length=50, null=True)
    echelon    = models.CharField(max_length=50, null=True)
    country    = models.CharField(max_length=50, null=True)
    role       = models.CharField(max_length=50, null=True)
    parent_echelon  = models.CharField(max_length=50, null=True)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['node'] = 'unit'
        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        attr['unit_number'] = self.unit_number
        attr['unit_type'] = self.unit_type
        attr['echelon'] = self.echelon
        return attr

class Resource(Entity):
    condition    = models.CharField(max_length=100, null=True)
    operational_status = models.CharField(max_length=50, null=True)
    availability = models.CharField(max_length=50, null=True)
    country      = models.CharField(max_length=50, null=True)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['node'] = 'resource'
        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        attr['condition'] = self.condition
        attr['operational_status'] = self.operational_status
        attr['availability'] = self.availability
        return attr

class Equipment(Resource):
    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['node'] = 'equipment'
        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        attr['condition'] = self.condition
        attr['operational_status'] = self.operational_status
        attr['availability'] = self.availability
        return attr


class Weapon(Resource):
    make    = models.CharField(max_length=50, null=True)
    model   = models.CharField(max_length=50, null=True)
    equipment_code = models.CharField(max_length=50, null=True)

class Vehicle(Resource):
    vin     = models.CharField(max_length=50, null=True)
    year    = models.CharField(max_length=10, null=True)
    make    = models.CharField(max_length=50, null=True)
    model   = models.CharField(max_length=50, null=True)
    license_number  = models.CharField(max_length=50, null=True)
    license_state  = models.CharField(max_length=50, null=True)
    license_country = models.CharField(max_length=50, null=True)
    color   = models.CharField(max_length=50, null=True)
    category = models.CharField(max_length=50, null=True)
    usage   = models.CharField(max_length=100, null=True)
    fuel_type = models.CharField(max_length=50, null=True)

class Facility(Resource):
    types     = models.CharField(max_length=100, null=True)
    primary_function = models.CharField(max_length=100, null=True)
    O_suffix  = models.CharField(max_length=50, null=True)
    BE_number = models.CharField(max_length=50, null=True)
    PIN       = models.CharField(max_length=50, null=True)

    class Meta:
        verbose_name_plural = "facilities"

class Document(Resource):
    title   = models.CharField(max_length=100, null=True)
    title_short = models.CharField(max_length=100, null=True)
    author  = models.CharField(max_length=100, null=True)
    is_broken_link   = models.NullBooleanField(null=True)
    url   = models.URLField(max_length=100, null=True)
    language  = models.CharField(max_length=50, null=True)
    medium    = models.CharField(max_length=50, null=True)
    types     = models.CharField(max_length=50, null=True)
    date_approved  = models.CharField(max_length=50, null=True)
    date_published  = models.CharField(max_length=50, null=True)

class Relationship(models.Model):
    source = models.ForeignKey(Entity, related_name="relates_as_source")
    target = models.ForeignKey(Entity, related_name="relates_as_target")
    description   = models.CharField(max_length=500, null=True)
    types  = models.CharField(max_length=100, null=True)
    frequency  = models.CharField(max_length=50, null=True)
    intelligence_evaluation  = models.CharField(max_length=50, null=True)
    date_begin  = models.DateTimeField(null=True)
    date_end    = models.DateTimeField(null=True)
    date_as_of  = models.DateTimeField(null=True)
    security_info  = models.CharField(max_length=50, null=True)
    guid  = models.CharField(max_length=50, null=True)

    def __unicode__(self):
        return self.source.name + '-' + self.target.name

    def getAllAttr(self):
        attr = {}
        attr['description'] = self.description
        attr['frequency']   = self.frequency
        attr['intelligence_evaluation'] = self.intelligence_evaluation
        return attr






