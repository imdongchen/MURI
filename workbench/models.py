from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class PIR(models.Model):
    author = models.ForeignKey(User)
    name   = models.CharField(max_length=100)
    content   = models.CharField(max_length=500)
    date_created = models.DateTimeField(null=True, blank=True)

    def __unicode__(self):
        return self.name

class Indicator(models.Model):
    author = models.ForeignKey(User, null=True, blank=True)
    content   = models.CharField(max_length=500)
    date_created = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    pir    = models.ManyToManyField(PIR)

    def __unicode__(self):
        return self.content[:20]

class Note(models.Model):
    author = models.ForeignKey(User, null=True, blank=True)
    content   = models.CharField(max_length=1000)
    date_created = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    indicator = models.ManyToManyField(Indicator, null=True, blank=True)
    pir = models.ManyToManyField(PIR, null=True, blank=True)

    def __unicode__(self):
        return self.content[:50]
