from django.db import models
from dashboard.models import DataEntry, Entity
from django.contrib.auth.models import User
import datetime

# Create your models here.
class Annotation(models.Model):
    # temporary, for annotator library
    start	= models.CharField(max_length=200)
    end 	= models.CharField(max_length=200)
    # end temporary
    startOffset = models.IntegerField()
    endOffset   = models.IntegerField()
    dataentry   = models.ForeignKey(DataEntry)
    entity  	= models.ForeignKey(Entity, blank=True, null=True)
    created_by  = models.ForeignKey(User, blank=True, null=True)
    created_at  = models.DateTimeField(default=datetime.datetime.now)

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
        ann['tag'] = {'id': self.entity.id, 'entity_type': self.entity.entity_type}

        return ann

    def __unicode__(self):
        return self.entities.all()[0].name

    # def save(self, *args, **kwargs):
    #     """
    #     create relationship between data entry and entity automatically
    #     """
    #     for entity in self.entities:
    #         rel, created = Relationship.objects.get_or_create(source=None, target=entity, dataentry=self.dataentry)
    #         if created:
    #             rel.relation = 'contain'
    #             rel.date = self.dataentry.date
    #             rel.created_by = self.created_by
    #             rel.save()
    #     super(Annotation, self).save(*args, **kwargs)
