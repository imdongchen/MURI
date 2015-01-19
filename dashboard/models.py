from django.contrib.gis.db import models
from model_utils.managers import InheritanceManager
from django.template.defaultfilters import slugify
from django.contrib.auth.models import User
from datetime import datetime
from django.db.models.fields import FieldDoesNotExist

from south.modelsinspector import add_introspection_rules
add_introspection_rules([], ["^django\.contrib\.gis\.db\.models\.fields\.GeometryField"])

# Create your models here.
def get_model_attr(instance):
    attr = {'primary': {}, 'other': {}}
    primary = attr['primary']
    for field_name in instance._meta.get_all_field_names():
        # these fields are 'outliers' and skipped
        if field_name == 'attributes' or field_name == 'entity_ptr':
            continue
        try:
            field = instance._meta.get_field(field_name)
            field_type = field.get_internal_type()
            value = getattr(instance, field_name)
            if field_type == 'DateTimeField':
                primary[field_name] = value.strftime('%m/%d/%Y-%H:%M:%S') if value else None
            elif field_type == 'GeometryField':
                primary[field_name] = value.wkt if value else None
            elif field_type == 'ForeignKey':
                if value:
                    primary[field_name] = value.id
            else:
                primary[field_name] = value
        except FieldDoesNotExist:
            pass

    other = attr['other']
    for a in instance.attributes.all():
        other[a.attr] = a.val

    return attr


class Attribute(models.Model):
    attr = models.CharField(max_length=255)
    val  = models.CharField(max_length=255)

    class Meta:
        unique_together = (("attr", "val"),)

    def __unicode__(self):
        return self.attr + ' : ' + self.val


class Entity(models.Model):
    name          = models.CharField(max_length=1000, null=True, blank=True)
    entity_type    = models.CharField(max_length=50, null=True, blank=True)
    attributes	  = models.ManyToManyField(Attribute, blank=True, null=True)
    created_by     = models.ForeignKey(User, null=True, blank=True, verbose_name='created by')
    created_at     = models.DateTimeField(default=datetime.now, null=True, blank=True, verbose_name='created at')

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

    def get_attr(self):
        return get_model_attr(self)


class Dataset(models.Model):
    name = models.CharField(max_length=500)
    created_by = models.ForeignKey(User, null=True, blank=True, verbose_name='created by')
    created_at  = models.DateTimeField(default=datetime.now, verbose_name='created at')

    def get_attr(self):
        attr = {}
        attr['id'] = self.id
        attr['name'] = self.name
        attr['created_by'] = self.created_by.username if self.created_by != None else None
        attr['created_at'] = self.created_at.strftime('%m/%d/%Y') if self.created_at else None
        attr['entries'] = self.dataentry_set.count()
        return attr


class DataEntry(models.Model):
    content = models.TextField()
    date  = models.DateTimeField(null=True, blank=True)
    dataset = models.ForeignKey(Dataset, null=True, blank=True)

    def get_attr(self):
        attr = {}
        attr['id'] = self.id
        attr['content'] = self.content
        attr['dataset'] = self.dataset.id
        attr['date']    = ''
        if self.date != None:
            attr['date']  = self.date.strftime('%m/%d/%Y')
        return attr


class Location(Entity):
    geometry = models.GeometryField(null=True, blank=True)
    imprecision = models.CharField(max_length=50, null=True, blank=True)

    objects = models.GeoManager()

    def _get_geom_type(self):
        return self.location.geom_type

    def save(self, *args, **kwargs):
        """auto fill entity_type"""
        self.entity_type = 'location'
        super(Location, self).save(*args, **kwargs)



class Person(Entity):
    gender       = models.CharField(max_length=10, null=True, blank=True)
    nationality  = models.CharField(max_length=50, null=True, blank=True)
    alias        = models.ForeignKey('self', null=True, blank=True)  # TODO: the person could be an alias to another person
    ethnicity    = models.CharField(max_length=50, null=True, blank=True)
    race         = models.CharField(max_length=10, null=True, blank=True)
    mariried     = models.CharField(max_length=10, null=True, blank=True)
    religion     = models.CharField(max_length=50, null=True, blank=True)

    def save(self, *args, **kwargs):
        """auto fill entity_type"""
        self.entity_type = 'person'
        super(Person, self).save(*args, **kwargs)



class Organization(Entity):
    category    = models.CharField(max_length=100, null=True, blank=True, verbose_name='type')
    nationality = models.CharField(max_length=50, blank=True, null=True)
    ethnicity   = models.CharField(max_length=50, null=True, blank=True)
    religion    = models.CharField(max_length=50, null=True, blank=True)

    def save(self, *args, **kwargs):
        """auto fill entity_type"""
        self.entity_type = 'organization'
        super(Organization, self).save(*args, **kwargs)



class Event(Entity):
    category     = models.CharField(max_length=100, null=True, blank=True, verbose_name='type')
    nationality  = models.CharField(max_length=50, null=True, blank=True)
    date         = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        """auto fill entity_type"""
        self.entity_type = 'event'
        super(Event, self).save(*args, **kwargs)




class Resource(Entity):
    condition    = models.CharField(max_length=100, null=True, blank=True)
    availability = models.CharField(max_length=50, null=True, blank=True)
    category    = models.CharField(max_length=50, null=True, blank=True, verbose_name='type')

    objects = InheritanceManager()

    def save(self, *args, **kwargs):
        """auto fill entity_type"""
        self.entity_type = 'resource'
        super(Resource, self).save(*args, **kwargs)


class Equipment(Resource):
    pass


class Weapon(Resource):
    make    = models.CharField(max_length=50, null=True, blank=True)
    model   = models.CharField(max_length=50, null=True, blank=True)
    equipment_code = models.CharField(max_length=50, null=True, blank=True)



class Vehicle(Resource):
    vin     = models.CharField(max_length=50, null=True, blank=True)
    year    = models.CharField(max_length=10, null=True, blank=True)
    make    = models.CharField(max_length=50, null=True, blank=True)
    model   = models.CharField(max_length=50, null=True, blank=True)
    license_number  = models.CharField(max_length=50, null=True, blank=True)
    license_state  = models.CharField(max_length=50, null=True, blank=True)
    license_country = models.CharField(max_length=50, null=True, blank=True)
    color   = models.CharField(max_length=50, null=True, blank=True)
    usage   = models.CharField(max_length=100, null=True, blank=True)
    fuel_type = models.CharField(max_length=50, null=True, blank=True)



class Facility(Resource):
    types     = models.CharField(max_length=100, null=True, blank=True)
    primary_function = models.CharField(max_length=100, null=True, blank=True)
    BE_number = models.CharField(max_length=50, null=True, blank=True)
    PIN       = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        verbose_name_plural = "facilities"



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


class Relationship(models.Model):
    source = models.ForeignKey(Entity, null=True, blank=True, related_name="relates_as_source") # trick here: if source is null, it is a "special" relationship, indicating that a dataentry 'contains' an entity
    target = models.ForeignKey(Entity, related_name="relates_as_target")
    description   = models.TextField(null=True, blank=True)
    relation  = models.CharField(max_length=500, null=True, blank=True)
    confidence  = models.FloatField(null=True, blank=True)
    date        = models.DateTimeField(null=True, blank=True)
    dataentry  = models.ForeignKey(DataEntry, null=True, blank=True)
    attributes  = models.ManyToManyField(Attribute, null=True, blank=True)
    created_at   = models.DateTimeField(default=datetime.now, verbose_name='created at')
    created_by  = models.ForeignKey(User, null=True, blank=True, verbose_name='created by')

    def __unicode__(self):
        return self.source.name + '-' + self.target.name

    def get_attr(self):
        return get_model_attr(self)
