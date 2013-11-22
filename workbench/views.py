# Create your views here.
from models import PIR, IW, Note
import json
from django.views.decorators.http import require_GET
from django.http import HttpResponse

@require_GET
def getPIRs(request):
    res = []
    pirs = PIR.objects.all().order_by("-date_created")
    for pir in pirs:
	pir_unit = {}
	pir_unit["pir"] = {}
	pir_unit["pir"]["name"] = pir.name
	pir_unit["pir"]["id"] = pir.id
	pir_unit["iw"] = []

	iws = pir.iw_set.all()
	for iw in iws:
	    pir_unit["iw"].append(iw.content)
	try:
	    note = Note.objects.get(pir=pir)
	except Note.DoesNotExist:
	    pir_unit["note"] = {}
	    res.append(pir_unit)
	else:
	    pir_unit["note"] = {}
	    pir_unit["note"]["content"] = note.content
	    pir_unit["note"]["date_created"] = note.date_created.strftime('%m/%d/%Y')
	    res.append(pir_unit)

    return HttpResponse(json.dumps(res), mimetype='application/json')

@require_GET
def getNote(request, pir):
    res = {}
    pir = int(pir)
    try:
	pir = PIR.objects.get(id=pir)
    except PIR.DoesNotExist:
	print "Warning: unknown pir requested"
	return
    else:
	note = Note.objects.get(pir=pir)
	res["content"] = note.content
	res["title"]   = note.title
	return HttpResponse(json.dumps(res), mimetype='application/json')
