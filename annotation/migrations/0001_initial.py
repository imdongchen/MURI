# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Annotation'
        db.create_table(u'annotation_annotation', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('startOffset', self.gf('django.db.models.fields.IntegerField')()),
            ('endOffset', self.gf('django.db.models.fields.IntegerField')()),
            ('message', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['dashboard.Message'])),
        ))
        db.send_create_signal(u'annotation', ['Annotation'])

        # Adding M2M table for field entities on 'Annotation'
        m2m_table_name = db.shorten_name(u'annotation_annotation_entities')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('annotation', models.ForeignKey(orm[u'annotation.annotation'], null=False)),
            ('entity', models.ForeignKey(orm[u'dashboard.entity'], null=False))
        ))
        db.create_unique(m2m_table_name, ['annotation_id', 'entity_id'])


    def backwards(self, orm):
        # Deleting model 'Annotation'
        db.delete_table(u'annotation_annotation')

        # Removing M2M table for field entities on 'Annotation'
        db.delete_table(db.shorten_name(u'annotation_annotation_entities'))


    models = {
        u'annotation.annotation': {
            'Meta': {'object_name': 'Annotation'},
            'endOffset': ('django.db.models.fields.IntegerField', [], {}),
            'entities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['dashboard.Entity']", 'symmetrical': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'message': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['dashboard.Message']"}),
            'startOffset': ('django.db.models.fields.IntegerField', [], {})
        },
        u'dashboard.entity': {
            'Meta': {'object_name': 'Entity'},
            'affiliation': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'allegiance': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'date_as_of': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'date_begin': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'date_end': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'date_first_info': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'entity_type': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'guid': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'intelligence_evaluation': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'security_info': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'})
        },
        u'dashboard.message': {
            'Meta': {'object_name': 'Message'},
            'content': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'date': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'tags': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['dashboard.Entity']", 'null': 'True', 'through': u"orm['dashboard.TagInMessage']", 'blank': 'True'}),
            'uid': ('django.db.models.fields.CharField', [], {'max_length': '10'})
        },
        u'dashboard.taginmessage': {
            'Meta': {'object_name': 'TagInMessage'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'message': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['dashboard.Message']"}),
            'tag': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['dashboard.Entity']"})
        }
    }

    complete_apps = ['annotation']