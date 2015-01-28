from django.db import models
from django.contrib.auth.models import User, Group
from datetime import datetime

from dashboard.models import Case


# Create your models here.
class Activity(models.Model):
    user = models.ForeignKey(User, null=True, blank=True)
    operation = models.CharField(max_length=200)
    # the object the action is performed on,
    # can be an annotation, entity, relationship, etc.
    item = models.CharField(max_length=50, null=True, blank=True)
    data = models.TextField(null=True, blank=True)  # json format
    time = models.DateTimeField(default=datetime.now)
    # whether the activity should be seen by user or only for research
    public = models.NullBooleanField(null=True, blank=True)
    case = models.ForeignKey(Case)
    group = models.ForeignKey(Group)

    class Meta:
        ordering = ['-time']

    def __unicode__(self):
        return self.user.username + ' ' + self.operation

