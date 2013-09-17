from django.db import models

# Create your models here.
class PIR(models.Model):
    author = models.ForiegnKey(User)
    content = models.CharField(max_length=500, null=True, blank=True)
    date   = models.DateTimeField(null=True, blank=True)

class Indicator(models.Model):
    author = models.ForiegnKey(User)
    content = models.CharField(max_length=500, null=True, blank=True)
    date   = models.DateTimeField(null=True, blank=True)
    pir    = models.ManyToManyField(PIR, null=True, blank=True)

class Evidence(models.Model):
    pass
