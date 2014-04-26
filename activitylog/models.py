from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

# Create your models here.
class Activity(models.Model):
    user = models.ForeignKey(User)
    operation = models.CharField(max_length=200)
    data = models.TextField(null=True, blank=True) # json format
    time = models.DateTimeField(default=datetime.now)

    class Meta:
	ordering = ['-time']
    def __unicode__(self):
	return self.user.username + ' ' + self.operation
