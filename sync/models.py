from django.db import models

from datetime import datetime

from django.contrib.auth.models import User


# Create your models here.
class Message(models.Model):
    sender = models.ForeignKey(User, related_name="send_from")
    receiver = models.ForeignKey(User, null=True, blank=True, related_name="send_to")
    content = models.TextField()
    sent_at = models.DateTimeField(default=datetime.now)

    def tojson(self):
        if self.receiver:
            receiver = self.receiver.id
        else:
            receiver = 0
        return {
            'sender': self.sender.id,
            'receiver': receiver,
            'content': self.content,
            'sent_at': self.sent_at.strftime('%m/%d/%Y-%H:%M:%S')
        }


def get_all_sent(sender):
    messages = Message.objects.filter(sender=sender)
    return [msg.json() for msg in messages]
