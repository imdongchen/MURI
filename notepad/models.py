from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

# Create your models here.

class Note(models.Model):
    created_by = models.ForeignKey(User, null=True, blank=True)
    title  = models.CharField(max_length=500, null=True, blank=True)
    content   = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=datetime.now)
    last_modified_at = models.DateTimeField(auto_now=True)

    def __unicode__(self):
        return self.content[:50]
