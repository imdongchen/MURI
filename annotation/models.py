from django.db import models
from dashboard.models import DataEntry, Entity, Relationship
from django.contrib.auth.models import User, Group
import datetime
from dashboard.models import Case


# Create your models here.
class Annotation(models.Model):
    start   = models.CharField(max_length=200)
    end     = models.CharField(max_length=200)
    startOffset = models.IntegerField()
    endOffset   = models.IntegerField()
    quote   = models.TextField()
    dataentry   = models.ForeignKey(DataEntry)
    entity      = models.ForeignKey(Entity, blank=True, null=True)
    relationship = models.ForeignKey(Relationship, blank=True, null=True)
    related_entities = models.ManyToManyField(Entity, blank=True, null=True, related_name='related_annotations')
    related_relationships = models.ManyToManyField(Relationship, blank=True, null=True, related_name='related_annotations')
    created_by  = models.ForeignKey(User, blank=True, null=True, related_name='created_annotations')
    last_edited_by  = models.ForeignKey(User, blank=True, null=True, related_name='edited_annotations')
    created_at  = models.DateTimeField(default=datetime.datetime.now)
    case    = models.ForeignKey(Case)
    group   = models.ForeignKey(Group)

    def serialize(self):
        ann = {}
        ann['id']     = self.id
        ann['ranges'] = [{
            'start': self.start,
            'end'  : self.end,
            'startOffset': self.startOffset,
            'endOffset'  : self.endOffset
        }]
        ann['anchor']   = self.dataentry.id
        ann['quote']   = self.quote
        ann['tag'] = {'id': self.entity.id, 'entity_type': self.entity.entity_type}
        ann['created_at'] = self.created_at.strftime('%m/%d/%Y-%H:%M:%S')
        ann['created_by'] = self.created_by.id
        ann['last_edited_by'] = self.last_edited_by.id

        related = []
        for e in self.related_entities.all():
            related.append(e.id)
        ann['related_entities'] = related

        return ann

    def __unicode__(self):
        return self.quote
