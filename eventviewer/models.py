from django.contrib.gis.db import models

# Create your models here.
class Footprint(models.Model):
    desc    = models.CharField(max_length=200, null=True)
    category= models.CharField(max_length=30, null=True)
    precision = models.FloatField(null=True)
    remark  = models.CharField(max_length=200, null=True)
    shape = models.GeometryField(null=True)

    objects = models.GeoManager()
    def _get_geom_type(self):
        return self.shape.geom_type

class Person(models.Model):
    LIVING_CHOICES = (
            ('Y', 'Yes')
            , ('N', 'No')
    )
    name    = models.CharField(max_length=100)
    alias   = models.CharField(max_length=50, null=True)
    sect    = models.CharField(max_length=100, null=True)
    region  = models.CharField(max_length=100, null=True)
    role    = models.CharField(max_length=100, null=True)
    prof    = models.CharField(max_length=100, null=True)
    living  = models.CharField(max_length=1, choices=LIVING_CHOICES, null=True)
    remark  = models.CharField(max_length=100, null=True)
    birth   = models.DateTimeField(null=True)

    def __unicode__(self):
        return self.name

class GroupInfo(models.Model):
    name    = models.CharField(max_length=100)
    category = models.CharField(max_length=30)
    desc    = models.CharField(max_length=100, null=True)
    remarks    = models.CharField(max_length=100, null=True)
    persons  = models.ManyToManyField(Person, db_table='eventviewer_person_group', null=True)

    def __unicode__(self):
        return self.name
    
class Facility(models.Model):
    category    = models.CharField(max_length=30)
    desc        = models.CharField(max_length=100, null=True)
    remark    = models.CharField(max_length=100, null=True)

    def __unicode__(self):
        return self.category
    class Meta:
        verbose_name_plural = "facilities"

class EventInfo(models.Model):
    category = models.CharField(max_length=30)
    desc     = models.CharField(max_length=300)
    date     = models.DateTimeField(null=True)
    remark   = models.CharField(max_length=300, null=True)
    persons  = models.ManyToManyField(Person, db_table='eventviewer_event_person', null=True)
    footprints = models.ManyToManyField(Footprint, db_table='eventviewer_event_footprint', null=True)
    groups   = models.ManyToManyField(GroupInfo, db_table='eventviewer_event_group', null=True)
    facilities= models.ManyToManyField(Facility, db_table='eventviewer_event_facility', null=True)

    def __unicode__(self):
        return self.category


