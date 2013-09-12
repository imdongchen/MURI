# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting field 'Object.condition'
        db.delete_column(u'dashboard_object', 'condition')


    def backwards(self, orm):
        # Adding field 'Object.condition'
        db.add_column(u'dashboard_object', 'condition',
                      self.gf('django.db.models.fields.CharField')(max_length=100, null=True),
                      keep_default=False)


    models = {
        u'dashboard.document': {
            'Meta': {'object_name': 'Document', '_ormbases': [u'dashboard.Object']},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'date_approved': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'date_published': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'is_broken_link': ('django.db.models.fields.NullBooleanField', [], {'null': 'True', 'blank': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'medium': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            u'object_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['dashboard.Object']", 'unique': 'True', 'primary_key': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'title_short': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'types': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '100', 'null': 'True'})
        },
        u'dashboard.entity': {
            'Meta': {'object_name': 'Entity'},
            'affiliation': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'allegiance': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'date_as_of': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'date_begin': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'date_end': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'date_first_info': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True'}),
            'guid': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'intelligence_evaluation': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'security_info': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'})
        },
        u'dashboard.equipment': {
            'Meta': {'object_name': 'Equipment', '_ormbases': [u'dashboard.Object']},
            u'object_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['dashboard.Object']", 'unique': 'True', 'primary_key': 'True'})
        },
        u'dashboard.event': {
            'Meta': {'object_name': 'Event', '_ormbases': [u'dashboard.Entity']},
            'category': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            u'entity_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['dashboard.Entity']", 'unique': 'True', 'primary_key': 'True'}),
            'nationality': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'purpose': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True'}),
            'types': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'})
        },
        u'dashboard.facility': {
            'BE_number': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'Meta': {'object_name': 'Facility', '_ormbases': [u'dashboard.Object']},
            'O_suffix': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'PIN': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            u'object_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['dashboard.Object']", 'unique': 'True', 'primary_key': 'True'}),
            'primary_function': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'types': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'})
        },
        u'dashboard.footprint': {
            'Meta': {'object_name': 'Footprint', '_ormbases': [u'dashboard.Entity']},
            u'entity_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['dashboard.Entity']", 'unique': 'True', 'primary_key': 'True'}),
            'imprecision': ('django.db.models.fields.FloatField', [], {'null': 'True'}),
            'location': ('django.contrib.gis.db.models.fields.GeometryField', [], {'null': 'True'})
        },
        u'dashboard.object': {
            'Meta': {'object_name': 'Object', '_ormbases': [u'dashboard.Entity']},
            'availability': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            u'entity_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['dashboard.Entity']", 'unique': 'True', 'primary_key': 'True'}),
            'operational_status': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'})
        },
        u'dashboard.organization': {
            'Meta': {'object_name': 'Organization', '_ormbases': [u'dashboard.Entity']},
            'date_founded': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            u'entity_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['dashboard.Entity']", 'unique': 'True', 'primary_key': 'True'}),
            'ethnicity': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'nationality': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'registration_country': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'registration_state': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'religion': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'types': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'})
        },
        u'dashboard.person': {
            'Meta': {'object_name': 'Person', '_ormbases': [u'dashboard.Entity']},
            'alias': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            u'entity_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['dashboard.Entity']", 'unique': 'True', 'primary_key': 'True'}),
            'ethnicity': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'gender': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'marital_status': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True'}),
            'middle_name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'nationality': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'place_birth': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'place_death': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'prefix': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True'}),
            'primary_citizenship': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'race': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True'}),
            'religion': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'secondary_citizenship': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'status': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'suffix': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True'})
        },
        u'dashboard.relationship': {
            'Meta': {'object_name': 'Relationship'},
            'date_as_of': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'date_begin': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'date_end': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True'}),
            'frequency': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'guid': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'intelligence_evaluation': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
            'security_info': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'relates_as_source'", 'to': u"orm['dashboard.Entity']"}),
            'target': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'relates_as_target'", 'to': u"orm['dashboard.Entity']"}),
            'types': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'})
        },
        u'dashboard.unit': {
            'Meta': {'object_name': 'Unit', '_ormbases': [u'dashboard.Entity']},
            'country': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'echelon': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            u'entity_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['dashboard.Entity']", 'unique': 'True', 'primary_key': 'True'}),
            'parent_echelon': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'role': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'unit_number': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'unit_type': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'})
        },
        u'dashboard.vehicle': {
            'Meta': {'object_name': 'Vehicle', '_ormbases': [u'dashboard.Object']},
            'category': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'color': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'fuel_type': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'license_country': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'license_number': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'license_state': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'make': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            u'object_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['dashboard.Object']", 'unique': 'True', 'primary_key': 'True'}),
            'usage': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'vin': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True'})
        },
        u'dashboard.weapon': {
            'Meta': {'object_name': 'Weapon', '_ormbases': [u'dashboard.Object']},
            'equipment_code': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'make': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            u'object_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['dashboard.Object']", 'unique': 'True', 'primary_key': 'True'})
        }
    }

    complete_apps = ['dashboard']