from django.contrib.gis.db import models
from model_utils.managers import InheritanceManager
from django.template.defaultfilters import slugify

from south.modelsinspector import add_introspection_rules
add_introspection_rules([], ["^django\.contrib\.gis\.db\.models\.fields\.GeometryField"])

# Create your models here.
class Attribute(models.Model):
    attr = models.CharField(max_length=255)
    val  = models.CharField(max_length=255)

    class Meta:
        unique_together = (("attr", "val"),)

    def __unicode__(self):
        return self.attr + ' : ' + self.val

class Entity(models.Model):
    name          = models.CharField(max_length=100, blank=True)
    entity_type    = models.CharField(max_length=50, null=True, blank=True)
    attributes	  = models.ManyToManyField(Attribute, blank=True, null=True)

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


class Message(models.Model):
    uid = models.CharField(max_length=10)
    content = models.CharField(max_length=1000)
    date  = models.DateTimeField(null=True, blank=True)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['content'] = self.content
        attr['date']    = ''
        if self.date != None:
            attr['date']  = self.date.strftime('%m/%d/%Y')
        return attr

class Location(Entity):
    location = models.GeometryField(null=True, blank=True)
    imprecision = models.FloatField(null=True, blank=True)

    objects = models.GeoManager()

    def _get_geom_type(self):
        return self.location.geom_type

    def save(self, *args, **kwargs):
        """auto fill entity_type"""
        self.entity_type = 'Location'
        super(Location, self).save(*args, **kwargs)


    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['entity'] = 'location'
        if self.location:
            attr['shape'] = self.location.wkt
            attr['srid'] = self.location.srid
        for a in self.attributes.all():
            attr[a.attr] = a.val

        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        return attr

class Person(Entity):
    first_name   = models.CharField(max_length=50, null=True, blank=True)
    middle_name  = models.CharField(max_length=50, null=True, blank=True)
    last_name    = models.CharField(max_length=50, null=True, blank=True)
    prefix       = models.CharField(max_length=10, null=True, blank=True)
    suffix       = models.CharField(max_length=10, null=True, blank=True)
    primary_citizenship  = models.CharField(max_length=50, null=True, blank=True)
    secondary_citizenship= models.CharField(max_length=50, null=True, blank=True)
    nationality    = models.CharField(max_length=50, null=True, blank=True)
    alias   = models.CharField(max_length=50, null=True, blank=True)
    place_birth  = models.CharField(max_length=50, null=True, blank=True)
    place_death  = models.CharField(max_length=50, null=True, blank=True)
    ethnicity    = models.CharField(max_length=50, null=True, blank=True)
    race         = models.CharField(max_length=10, null=True, blank=True)
    gender       = models.CharField(max_length=10, null=True, blank=True)
    marital_status = models.CharField(max_length=10, null=True, blank=True)
    religion     = models.CharField(max_length=50, null=True, blank=True)
    status       = models.CharField(max_length=50, null=True, blank=True)

    def save(self, *args, **kwargs):
        """auto fill entity_type"""
        self.entity_type = 'Person'
        super(Person, self).save(*args, **kwargs)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['gender'] = self.gender
        attr['race'] = self.race
        attr['nationality'] = self.nationality
        attr['entity'] = 'person'
        for a in self.attributes.all():
            attr[a.attr] = a.val

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
    types    = models.CharField(max_length=100, null=True, blank=True)
    nationality = models.CharField(max_length=50, blank=True, null=True)
    ethnicity   = models.CharField(max_length=50, null=True, blank=True)
    religion    = models.CharField(max_length=50, null=True, blank=True)
    date_founded = models.DateTimeField(null=True, blank=True)
    registration_country = models.CharField(max_length=50, null=True, blank=True)
    registration_state    = models.CharField(max_length=50, null=True, blank=True)

    def save(self, *args, **kwargs):
        """auto fill entity_type"""
        self.entity_type = 'Organization'
        super(Organization, self).save(*args, **kwargs)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['types'] = self.types
        attr['nationality'] = self.nationality
        attr['ethnicity'] = self.ethnicity
        attr['religion'] = self.religion
        attr['entity'] = 'organization'
        for a in self.attributes.all():
            attr[a.attr] = a.val

        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        return attr

class Event(Entity):
    types    = models.CharField(max_length=100, null=True, blank=True)
    category = models.CharField(max_length=100, null=True, blank=True)
    nationality= models.CharField(max_length=50, null=True, blank=True)
    purpose  = models.CharField(max_length=500, null=True, blank=True)
    date  = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        """auto fill entity_type"""
        self.entity_type = 'Event'
        super(Event, self).save(*args, **kwargs)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['types'] = self.types
        attr['entity'] = 'event'
        attr['date'] = ''
        if self.date != None:
            attr['date']  = self.date.strftime('%m/%d/%Y')
        for a in self.attributes.all():
            attr[a.attr] = a.val

        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        attr['nationality'] = self.nationality
        attr['intelligence_evaluation'] = self.intelligence_evaluation
        messages = self.message_set.all()
        if len(messages) != 0:
            attr['messages'] = [message for message in messages]
        return attr

class Unit(Entity):
    unit_number    = models.CharField(max_length=50, null=True, blank=True)
    unit_type    = models.CharField(max_length=50, null=True, blank=True)
    echelon    = models.CharField(max_length=50, null=True, blank=True)
    country    = models.CharField(max_length=50, null=True, blank=True)
    role       = models.CharField(max_length=50, null=True, blank=True)
    parent_echelon  = models.CharField(max_length=50, null=True, blank=True)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['entity'] = 'unit'
        for a in self.attributes.all():
            attr[a.attr] = a.val

        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        attr['unit_number'] = self.unit_number
        attr['unit_type'] = self.unit_type
        attr['echelon'] = self.echelon
        return attr

class Resource(Entity):
    condition    = models.CharField(max_length=100, null=True, blank=True)
    operational_status = models.CharField(max_length=50, null=True, blank=True)
    availability = models.CharField(max_length=50, null=True, blank=True)
    country      = models.CharField(max_length=50, null=True, blank=True)
    resource_type    = models.CharField(max_length=50, null=True, blank=True)

    objects = InheritanceManager()

    def save(self, *args, **kwargs):
        """auto fill entity_type"""
        self.entity_type = 'Resource'
        super(Resource, self).save(*args, **kwargs)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['condition'] = self.condition
        attr['entity'] = 'resource'
        attr['resource_type'] = self.resource_type
        for a in self.attributes.all():
            attr[a.attr] = a.val

        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        attr['operational_status'] = self.operational_status
        attr['availability'] = self.availability
        attr = self.getKeyAttr()
        return attr

class Equipment(Resource):
    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['condition'] = self.condition
        attr['operational_status'] = self.operational_status
        attr['availability'] = self.availability
        attr['entity'] = 'resource.equipment'
        attr['resource_type'] = 'equipment'
        for a in self.attributes.all():
            attr[a.attr] = a.val

        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        return attr


class Weapon(Resource):
    make    = models.CharField(max_length=50, null=True, blank=True)
    model   = models.CharField(max_length=50, null=True, blank=True)
    equipment_code = models.CharField(max_length=50, null=True, blank=True)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['condition'] = self.condition
        attr['operational_status'] = self.operational_status
        attr['availability'] = self.availability
        attr['entity'] = 'resource.weapon'
        attr['resource_type'] = 'weapon'
        for a in self.attributes.all():
            attr[a.attr] = a.val

        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        return attr

class Vehicle(Resource):
    vin     = models.CharField(max_length=50, null=True, blank=True)
    year    = models.CharField(max_length=10, null=True, blank=True)
    make    = models.CharField(max_length=50, null=True, blank=True)
    model   = models.CharField(max_length=50, null=True, blank=True)
    license_number  = models.CharField(max_length=50, null=True, blank=True)
    license_state  = models.CharField(max_length=50, null=True, blank=True)
    license_country = models.CharField(max_length=50, null=True, blank=True)
    color   = models.CharField(max_length=50, null=True, blank=True)
    category = models.CharField(max_length=50, null=True, blank=True)
    usage   = models.CharField(max_length=100, null=True, blank=True)
    fuel_type = models.CharField(max_length=50, null=True, blank=True)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['condition'] = self.condition
        attr['operational_status'] = self.operational_status
        attr['availability'] = self.availability
        attr['entity'] = 'resource.vehicle'
        attr['resource_type'] = 'vehicle'
        for a in self.attributes.all():
            attr[a.attr] = a.val

        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        return attr

class Facility(Resource):
    types     = models.CharField(max_length=100, null=True, blank=True)
    primary_function = models.CharField(max_length=100, null=True, blank=True)
    O_suffix  = models.CharField(max_length=50, null=True, blank=True)
    BE_number = models.CharField(max_length=50, null=True, blank=True)
    PIN       = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        verbose_name_plural = "facilities"

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['condition'] = self.condition
        attr['operational_status'] = self.operational_status
        attr['availability'] = self.availability
        attr['entity'] = 'resource.facility'
        attr['resource_type'] = 'facility'
        for a in self.attributes.all():
            attr[a.attr] = a.val

        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        return attr

class Document(Resource):
    title   = models.CharField(max_length=100, null=True, blank=True)
    title_short = models.CharField(max_length=100, null=True, blank=True)
    author  = models.CharField(max_length=100, null=True, blank=True)
    is_broken_link   = models.NullBooleanField(null=True, blank=True)
    url   = models.URLField(max_length=100, null=True, blank=True)
    language  = models.CharField(max_length=50, null=True, blank=True)
    medium    = models.CharField(max_length=50, null=True, blank=True)
    types     = models.CharField(max_length=50, null=True, blank=True)
    date_approved  = models.CharField(max_length=50, null=True, blank=True)
    date_published  = models.CharField(max_length=50, null=True, blank=True)

    def getKeyAttr(self):
        attr = {}
        attr['uid'] = self.id
        attr['name'] = self.name
        attr['condition'] = self.condition
        attr['operational_status'] = self.operational_status
        attr['availability'] = self.availability
        attr['entity'] = 'resource.document'
        attr['resource_type'] = 'document'
        for a in self.attributes.all():
            attr[a.attr] = a.val

        return attr

    def getAllAttr(self):
        attr = self.getKeyAttr()
        return attr

class Relationship(models.Model):
    source = models.ForeignKey(Entity, related_name="relates_as_source")
    target = models.ForeignKey(Entity, related_name="relates_as_target")
    description   = models.CharField(max_length=500, null=True, blank=True)
    types  = models.CharField(max_length=100, null=True, blank=True)
    frequency  = models.CharField(max_length=50, null=True, blank=True)
    intelligence_evaluation  = models.CharField(max_length=50, null=True, blank=True)
    date_begin  = models.DateTimeField(null=True, blank=True)
    date_end    = models.DateTimeField(null=True, blank=True)
    date_as_of  = models.DateTimeField(null=True, blank=True)
    security_info  = models.CharField(max_length=50, null=True, blank=True)
    guid  = models.CharField(max_length=50, null=True, blank=True)

    def __unicode__(self):
        return self.source.name + '-' + self.target.name

    def getAllAttr(self):
        attr = {}
        attr['description'] = self.description
        attr['frequency']   = self.frequency
        attr['intelligence_evaluation'] = self.intelligence_evaluation
        return attr
