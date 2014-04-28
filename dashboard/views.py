from django.shortcuts import render
from models import *
from django.http import HttpResponse
import json
import networkx as nx
from networkx.readwrite import json_graph
from itertools import combinations
from django.template import Context
from django.db.models import Q
from itertools import chain
import copy

def index(request):
    bbox    = request.REQUEST.getlist('map')
    time    = request.REQUEST.getlist('time')
    message_ids   = request.REQUEST.getlist('messages')
    dialogs = []
    if (len(bbox) != 0):
        dialogs.append("map")
    if (len(time) != 0): 
        dialogs.append("timeline")
    if (len(message_ids) != 0): 
        dialogs.append("message_table")

    return render(request, 'dashboard/index.html', Context({"dialogs": dialogs}))

def queryEvent(request):
    response = {}
    response['aaData'] = [] # this field name is required by client 
    events = Event.objects.all().order_by('date')
    for event in events:
        date_begin = ""
        date_end = ""
        if event.date_begin != None:
            date_begin = event.date_begin.strftime('%m/%d/%Y')
        if event.date_end != None:
            date_end = event.date_end.strftime('%m/%d/%Y')

        record = [event.name, event.types, date_begin, date_end]
        response['aaData'].append(record)

    return HttpResponse(json.dumps(response), mimetype='application/json')

def getData(request):
    response = {}
    response['data'] = []
    messages = Message.objects.all().order_by('-date')
    for msg in messages:
        e_info = {}
        e_info = msg.getKeyAttr()


        e_info['organizations']  = [] 
        e_info['resources']  = [] 
        e_info['persons']  = [] 
        e_info['locations']  = [] 
        e_info['events']  = [] 

	annotations = []
	if request.user.is_authenticated():
	    annotations = msg.annotation_set.filter(created_by=request.user)
	else:
	    annotations = msg.annotation_set.all()

	for ann in annotations:
	    entities = ann.entities.all().select_subclasses()
	    for entity in entities:
		if hasattr(entity, 'organization'):
		    e_info['organizations'].append(entity.getKeyAttr())
		elif hasattr(entity, 'resource'):
		    e_info['resources'].append(entity.getKeyAttr())
		elif hasattr(entity, 'person'):
		    e_info['persons'].append(entity.getKeyAttr())
		elif hasattr(entity, 'location'):
		    e_info['locations'].append(entity.getKeyAttr())
		elif hasattr(entity, 'event'):
		    e_info['events'].append(entity.getKeyAttr())


#
#        for mes in event.message_set.all():
#            e_info['messages'].append(mes.getKeyAttr())
#
#        linked_entities = list(chain(event.findTargets(), event.findSources()))
#        for entity in linked_entities:
#            if hasattr(entity, 'organization'):
#                e_info['organizations'].append(entity.getKeyAttr())
#            elif hasattr(entity, 'resource'):
#                e_info['resources'].append(entity.getKeyAttr())
#            elif hasattr(entity, 'person'):
#                e_info['persons'].append(entity.getKeyAttr())
#            elif hasattr(entity, 'location'):
#                e_info['locations'].append(entity.getKeyAttr())

        response['data'] += flatten(e_info)

    return HttpResponse(json.dumps(response), mimetype='application/json')

def flatten(dic):
    res = []
    for person in dic['persons']+[{}]:
	rec = {}
	rec['uid'] = dic['uid']
	rec['date'] = dic['date']
	rec['content'] = dic['content']

        if len(dic['persons']) != 0 and person == {}:
            continue
	rec['person'] = person
	for org in dic['organizations']+[{}]:
            if len(dic['organizations']) != 0 and org == {}:
                continue
            rec['organization'] = org
            for resource in dic['resources']+[{}]:
                if len(dic['resources']) != 0 and resource == {}:
                    continue
                rec['resource'] = resource
                for fp in dic['locations']+[{}]:
                    if len(dic['locations']) != 0 and fp == {}:
                        continue
                    rec['location'] = fp
                    for event in dic['events']+[{}]:
                        if len(dic['events']) != 0 and event == {}:
                            continue
                        rec['event'] = event
                        res.append(copy.deepcopy(rec))
    return res

def prepareNetwork(request):
    if request.method == 'GET':
        response = {}
        response['nodes'] = []
        response['links'] = []
        node_types = request.GET.getlist('entities[]', None)
        filter_id = request.GET.getlist('messages_id[]', None)

        if node_types == None or filter_id == None:
            return

        graph   = nx.DiGraph()

	# construct network on 'co-occurrance'
        msgs = Message.objects.filter(id__in=filter_id)
	annotations = []
	for msg in msgs:
	    if request.user.is_authenticated():
		annotations = msg.annotation_set.filter(created_by=request.user)
	    else:
		annotations = msg.annotation_set.all()
	    if len(annotations) > 0:
		graph.add_node('m'+str(msg.id), msg.getKeyAttr())
		for ann in annotations:
		    entities = ann.entities.all().select_subclasses()
		    for ent in entities:
			graph.add_node(ent.id, ent.getKeyAttr())
			graph.add_edge('m'+str(msg.id), ent.id, rel='contains')
			targets = ent.findTargets()
			sources = ent.findSources()
			for target in targets:
			    rels = Relationship.objects.filter(source=ent,target=target)
			    graph.add_node(target.id, target.getKeyAttr())
			    for rel in rels:
				graph.add_edge(ent.id, target.id, rel=rel.description)
			for source in sources:
			    rels = Relationship.objects.filter(source=source,target=ent)
			    graph.add_node(source.id, source.getKeyAttr())
			    for rel in rels:
				graph.add_edge(source.id, ent.id, rel=rel.description)

	

#       linked_entities = list(events.select_subclasses())

#       for eve in events:
#           entities = list(chain(eve.findTargets(), eve.findSources()))
#           linked_entities += entities
#       for entity in linked_entities:
#           graph.add_node(entity.id, entity.getKeyAttr())

#       relations = Relationship.objects.filter( Q(source__in=linked_entities) & Q(target__in=linked_entities) )
#       for relation in relations:
#           graph.add_edge(relation.source.id, relation.target.id, relation.getAllAttr())

        return HttpResponse(json_graph.dumps(graph), mimetype='application/json')
    return

def network_relation(request):
    res = {}
    if request.method == "POST":
	source = request.POST.get('source', '')
	target = request.POST.get('target', '')
	rel    = request.POST.get('rel', '')

	if source == '' or target == '':
	    return
	if source[0] == 'm':
	    source = Message.objects.get(id=int(source[1:]))
	else: 
	    source = Entity.objects.get(id=int(source))
	if target[0] == 'm':
	    target = Message.objects.get(id=int(target[1:]))
	else: 
	    target = Entity.objects.get(id=int(target))

	rel, created = Relationship.objects.get_or_create(source=source, target=target, description=rel)
	rel.save()
	res['source'] = source.id
	res['target'] = target.id
	res['rel'] = rel.description
	res['id'] = rel.id

	return HttpResponse(json.dumps(res), mimetype='application/json')



def entity_attr(request):
    if request.method == "POST":
	entity = request.POST.get("entity", "")
	attr	= request.POST.get("attr", "")
	id  = request.POST.get("row_id", 0)
	id = str(id)
	val = request.POST.get("value", "")
	if not entity or not attr or not id: 
	    print "Warning: request params incorrect"
	    return 
	try:
	    ent = Entity.objects.filter(id=id).select_subclasses()[0]
	except Entity.DoesNotExist:
	    print "entity not exist for editing"
	    return
	else:
	    if not hasattr(ent, entity) :
		print "lala"
		return 
	    if not hasattr(ent, attr):
		print ent
		print attr
		print "haha"
		return
	    setattr(ent, attr, val)
	    ent.save()
	    return HttpResponse(val)
