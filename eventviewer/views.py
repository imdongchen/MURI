from django.shortcuts import render
from models import *
from django.http import HttpResponse
import json
import networkx as nx
from networkx.readwrite import json_graph
from itertools import combinations

def index(request):
    return render(request, 'eventviewer/index.html')

def queryEvent(request):
    response = {}
    response['aaData'] = [] # this field name is required by client 
    events = EventInfo.objects.all().order_by('date')
    for event in events:
        try:
            record = [event.category, event.desc, event.date.strftime('%m/%d/%Y')]
        except:
            record = [event.category, event.desc, '']
        response['aaData'].append(record)

    return HttpResponse(json.dumps(response), mimetype='application/json')

def getData(request):
    response = {}
    response['events'] = []
    events = EventInfo.objects.all().order_by('date')
    for event in events:
        e_info = {}
        e_info['category']  = event.category 
        e_info['desc']      = event.desc 
        e_info['date']      = ''
        if (event.date != ''): 
            e_info['date']  = event.date.strftime('%m/%d/%Y') 
        e_info['groups']  = [] 
        for group in event.groups.all():
            g_info = {}
            g_info['name']      = group.name
            g_info['category']  = group.category
            g_info['desc']      = group.desc
            e_info['groups'].append(g_info)
        e_info['facilities'] = []
        for facility in event.facilities.all():
            f_info = {}
            f_info['category']  = facility.category
            f_info['desc']      = facility.desc
            e_info['facilities'].append(f_info)
        e_info['footprints'] = []
        for fp in event.footprints.all():
            fp_info = {}
            pass
        e_info['persons'] = []
        for person in event.persons.all():
            p_info = {}
            p_info['id']        = 'p' + str(person.id)
            p_info['name']      = person.name
            p_info['alias']     = person.alias
            p_info['sect']      = person.sect
            p_info['region']    = person.region
            p_info['role']      = person.role
            p_info['prof']      = person.prof
            p_info['living']    = person.living
            p_info['birth']     = person.birth
            p_info['groups']    = []
            for group in person.groupinfo_set.all():
                g_info = {}
                g_info['id']        = 'g' + str(group.id)
                g_info['name']      = group.name
                g_info['category']  = group.category
                g_info['desc']      = group.desc
                p_info['groups'].append(g_info)

            e_info['persons'].append(p_info)

        response['events'].append(e_info)

    return HttpResponse(json.dumps(response), mimetype='application/json')

def prepareNetwork(request):
    response = {}
    response['nodes'] = []
    response['links'] = []
    node_type = request.GET.getlist('node', None)
    print node_type
    link_type = request.GET.get('link', None)
    graph   = nx.Graph()

    if node_type:
        if 'person' in node_type:
            persons = Person.objects.all()
            for person in persons:
                node_attr = {}
                node_attr['name'] = person.name
                node_attr['alias']    = person.alias
                node_attr['prof']     = person.prof
                node_attr['living']   = person.living
                node_attr['birth']    = person.birth
                node_attr['photo']    = ''
                node_attr['type']     = 'person'
                graph.add_node('p_'+str(person.id), node_attr)
        if 'group' in node_type:
            groups = GroupInfo.objects.all()
            for group in groups:
                node_attr = {}
                node_attr['name']     = group.name
                node_attr['category'] = group.category
                node_attr['desc']     = group.desc
                node_attr['type']     = 'group'
                graph.add_node('g_'+str(group.id), node_attr)

                # add person-group link
                group_persons = group.persons.all()
                for g_p in group_persons:
                    graph.add_edge('p_'+str(g_p.id), 'g_'+str(group.id))

    print 'number of nodes: ', graph.number_of_nodes()
    print 'number of links: ', graph.number_of_edges()

    return HttpResponse(json_graph.dumps(graph), mimetype='application/json')






