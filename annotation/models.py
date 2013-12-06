from django.db import models
from dashboard.models import Message, Entity

# Create your models here.
class Annotation(models.Model):
    # temporary, for annotator library
    start	= models.CharField(max_length=200)
    end 	= models.CharField(max_length=200)
    # end temporary
    startOffset = models.IntegerField()
    endOffset   = models.IntegerField()
    message	= models.ForeignKey(Message)
    entities	= models.ManyToManyField(Entity)

    def serialize(self):
	ann = {}
	ann['id']     = self.id
	ann['ranges'] = [{
	    'start': self.start,
	    'end'  : self.end,
	    'startOffset': self.startOffset,
	    'endOffset'  : self.endOffset
	}]
	ann['anchor_id']   = self.message.id
	ann['tags'] = []
	for ent in self.entities.select_subclasses():
	    ann['tags'].append(ent.getKeyAttr())
	print ann
	return ann

