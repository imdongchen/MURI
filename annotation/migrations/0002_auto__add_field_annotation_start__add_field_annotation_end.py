# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'Annotation.start'
        db.add_column(u'annotation_annotation', 'start',
                      self.gf('django.db.models.fields.CharField')(default='', max_length=200),
                      keep_default=False)

        # Adding field 'Annotation.end'
        db.add_column(u'annotation_annotation', 'end',
                      self.gf('django.db.models.fields.CharField')(default='', max_length=200),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting field 'Annotation.start'
        db.delete_column(u'annotation_annotation', 'start')

        # Deleting field 'Annotation.end'
        db.delete_column(u'annotation_annotation', 'end')


    models = {
        u'annotation.annotation': {
            'Meta': {'object_name': 'Annotation'},
            'end': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'endOffset': ('django.db.models.fields.IntegerField', [], {}),
            'entities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['dashboard.Entity']", 'symmetrical': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'message': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['dashboard.Message']"}),
            'start': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'startOffset': ('django.db.models.fields.IntegerField', [], {})
        },
        u'dashboard.entity': {
            'Meta': {'object_name': 'Entity'},
            'affiliation': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'}),
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
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'}),
            'security_info': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'})
        },
        u'dashboard.message': {
            'Meta': {'object_name': 'Message'},
            'content': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'date': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'uid': ('django.db.models.fields.CharField', [], {'max_length': '10'})
        }
    }

    complete_apps = ['annotation']