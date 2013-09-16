import xlrd
from dashboard.models import *
from dateutil import parser
from django.contrib.gis.geos import Point
import mgrs

def importEntitiesFromFile(filename):
    book = xlrd.open_workbook(filename)
    sheets = book.sheets()
    for sheet in sheets:
        if sheet.name == "Event":
            for rownum in range(1, sheet.nrows):
                row = sheet.row_values(rownum)
                event = Event(name=row[0], 
                        entity_type='event',
                        security_info=row[1], 
                        types=row[2], 
                        category=row[3], 
                        date_begin=formatDate(row[4]),
                        date_end=formatDate(row[5]),
                        date_as_of=formatDate(row[6]),
                        date_first_info=formatDate(row[7]),
                        affiliation=row[8],
                        allegiance=row[9],
                        nationality=row[11],
                        intelligence_evaluation=row[12],
                        guid=row[15])
                event.save()
        elif sheet.name == "Organization":
            for rownum in range(1, sheet.nrows):
                row = sheet.row_values(rownum)
                org= Organization(name=row[0], 
                        entity_type='organization',
                        security_info=row[1], 
                        types=row[2], 
                        date_as_of=formatDate(row[3]),
                        date_first_info=formatDate(row[4]),
                        affiliation=row[5],
                        allegiance=row[6],
                        nationality=row[9],
                        ethnicity=row[10],
                        religion=row[11],
                        date_begin=formatDate(row[12]),
                        registration_country=row[13],
                        registration_state=row[14],
                        intelligence_evaluation=row[15],
                        guid=row[18])
                org.save()
        elif sheet.name == "Equipment":
            for rownum in range(1, sheet.nrows):
                row = sheet.row_values(rownum)
                equip= Equipment(name=row[0], 
                        entity_type='resource',
                        resource_type='equipment',
                        security_info=row[1], 
                        date_as_of=formatDate(row[4]),
                        date_first_info=formatDate(row[5]),
                        affiliation=row[6],
                        allegiance=row[7],
                        country=row[8],
                        condition=row[13],
                        operational_status=row[14],
                        intelligence_evaluation=row[16],
                        availability=row[22],
                        guid=row[41])
                equip.save()
        elif sheet.name == "Place":
            for rownum in range(1, sheet.nrows):
                row = sheet.row_values(rownum)
                footprint= Footprint(name=row[0], 
                        entity_type='place',
                        security_info=row[1], 
                        date_as_of=formatDate(row[2]),
                        date_begin=formatDate(row[3]),
                        date_first_info=formatDate(row[4]),
                        affiliation=row[5],
                        allegiance=row[6],
                        intelligence_evaluation=row[7],
                        guid=row[9],
                        shape=formatGeometry(row[10]))
                footprint.save()
        elif sheet.name == "Person":
            for rownum in range(1, sheet.nrows):
                row = sheet.row_values(rownum)
                person= Person(name=row[0], 
                        entity_type='person',
                        security_info=row[1], 
                        first_name=row[2], 
                        middle_name=row[3], 
                        last_name=row[4], 
                        prefix=row[5], 
                        suffix=row[6], 
                        primary_citizenship=row[7], 
                        secondary_citizenship=row[8], 
                        nationality=row[9],
                        date_begin=formatDate(row[10]),
                        date_end=formatDate(row[11]),
                        place_birth=formatDate(row[12]),
                        place_death=formatDate(row[13]),
                        date_as_of=formatDate(row[14]),
                        date_first_info=formatDate(row[15]),
                        affiliation=row[16],
                        allegiance=row[17],
                        ethnicity=row[18],
                        race=row[19],
                        gender=row[20],
                        marital_status=row[21],
                        religion=row[22],
                        status=row[23],
                        intelligence_evaluation=row[24],
                        guid=row[26])
                person.save()
        elif sheet.name == "Weapon":
            for rownum in range(1, sheet.nrows):
                row = sheet.row_values(rownum)
                weapon= Weapon(name=row[0], 
                        entity_type='resource',
                        resource_type='weapon',
                        security_info=row[1], 
                        affiliation=row[3],
                        allegiance=row[4],
                        condition=row[6],
                        country=row[7],
                        make=row[9],
                        model=row[10],
                        equipment_code=row[37],
                        availability=row[39],
                        operational_status=row[40],
                        date_begin=formatDate(row[43]),
                        date_end=formatDate(row[44]),
                        date_as_of=formatDate(row[45]),
                        intelligence_evaluation=row[46],
                        date_first_info=formatDate(row[47]),
                        guid=row[48])
                weapon.save()
        elif sheet.name == "Vehicle":
            for rownum in range(1, sheet.nrows):
                row = sheet.row_values(rownum)
                vehicle= Vehicle(name=row[0], 
                        entity_type='resource',
                        resource_type='vehicle',
                        security_info=row[1], 
                        date_as_of=formatDate(row[6]),
                        date_first_info=formatDate(row[7]),
                        affiliation=row[8],
                        allegiance=row[9],
                        country=row[10],
                        vin=row[15],
                        year=row[16],
                        make=row[17],
                        model=row[18],
                        license_number=row[19],
                        license_state=row[20],
                        license_country=row[21],
                        color=row[22],
                        category=row[23],
                        usage=row[24],
                        fuel_type=row[25],
                        condition=row[26],
                        operational_status=row[27],
                        availability=row[35],
                        intelligence_evaluation=row[37],
                        guid=row[54])
                vehicle.save()
        elif sheet.name == "Facility":
            for rownum in range(1, sheet.nrows):
                row = sheet.row_values(rownum)
                facility= Facility(name=row[0], 
                        entity_type='resource',
                        resource_type='facility',
                        security_info=row[1], 
                        types=row[2],
                        date_as_of=formatDate(row[6]),
                        date_begin=formatDate(row[7]),
                        date_end=formatDate(row[8]),
                        date_first_info=formatDate(row[9]),
                        affiliation=row[10],
                        allegiance=row[11],
                        primary_function=row[12],
                        country=row[13],
                        intelligence_evaluation=row[14],
                        condition=row[15],
                        operational_status=row[16],
                        O_suffix=row[17],
                        BE_number=row[18],
                        PIN=row[19],
                        availability=row[20],
                        guid=row[45])
                facility.save()
        elif sheet.name == "Document":
            for rownum in range(1, sheet.nrows):
                row = sheet.row_values(rownum)
                doc= Document(name=row[0], 
                        entity_type='resource',
                        resource_type='document',
                        security_info=row[1], 
                        title=row[2], 
                        title_short=row[3], 
                        description=row[4], 
                        author=row[6], 
                        is_broken_link=formatBool(row[8]), 
                        url=formatBool(row[9]), 
                        language=row[12], 
                        medium=row[13], 
                        types=row[15], 
                        date_published=formatDate(row[20]),
                        date_approved=formatDate(row[21]),
                        date_begin=formatDate(row[22]),
                        date_end=formatDate(row[23]),
                        date_first_info=formatDate(row[24]),
                        guid=row[26])
                doc.save()
        elif sheet.name == "Unit":
            for rownum in range(1, sheet.nrows):
                row = sheet.row_values(rownum)
                unit= Unit(name=row[1], 
                        entity_type='unit',
                        security_info=row[0], 
                        unit_number=row[2], 
                        unit_type=row[3], 
                        echelon=row[4], 
                        date_as_of=formatDate(row[5]),
                        date_first_info=formatDate(row[6]),
                        affiliation=row[7],
                        allegiance=row[8],
                        country=row[12],
                        intelligence_evaluation=row[13],
                        role=row[17],
                        parent_echelon=row[23],
                        guid=row[43])
                unit.save()

def importMessagesFromFile(filename):
    import datetime
    book = xlrd.open_workbook(filename)
    sheet = book.sheet_by_name("Message")
# import messages
    try:
        for rownum in range(sheet.nrows):
            row = sheet.row_values(rownum)
            message = Message(uid=str(row[0]).split(".")[0], # for some reason the id shows up as 1.0, 11.0
                    date = datetime.datetime(*xlrd.xldate_as_tuple(row[1], 0)),
                    content = row[2])
            message.save()
    except Exception as e:
        print e

    sheet = book.sheet_by_name("Event")
# import the relationship between messages and events
    try:
        for rownum in range(1, sheet.nrows):
            row = sheet.row_values(rownum)
            event_guid = row[15]
            messages_id = row[10].split(",")
            event = Event.objects.get(guid=event_guid)
            for message in Message.objects.filter(uid__in=messages_id):
                event.message_set.add(message)
                event.save()
    except Exception as e:
        print e


def importRelationshipsFromFile(filename):
    book = xlrd.open_workbook(filename)
    sheets = book.sheets()
    for sheet in sheets:
        if sheet.name == "Relationship":
            for rownum in range(1, sheet.nrows):
                try:
                    row = sheet.row_values(rownum)
                    source = Entity.objects.get(guid=row[2])
                    target = Entity.objects.get(guid=row[5])
                    relationship= Relationship( 
                            source=source, 
                            target=target, 
                            description=row[6], 
                            types=row[7], 
                            frequency=row[8], 
                            intelligence_evaluation=row[9],
                            date_begin=formatDate(row[10]),
                            date_end=formatDate(row[11]),
                            date_as_of=formatDate(row[12]),
                            security_info=row[13],
                            guid=row[14])
                    relationship.save()
                except Entity.DoesNotExist as e:
                    print "Error: Entity as node doesn't exist: ", e
                except Exception as e:
                    print "Error: Import relationship record failed: ", e

def importIEDFromFile(filename):
    import csv
    with open(filename, 'rb') as f:
        reader = csv.reader(f, delimiter=',', quotechar='"')
        for row in reader:
            event = Event(name='IED', 
                    entity_type='event',
                    types=row[2], 
                    category=row[3], 
                    description=row[4],
                    date_begin=formatDate(row[1])
                    )
            event.save()
            footprint= Footprint( 
                    entity_type='place',
                    date_begin=formatDate(row[1]),
                    shape=formatGeometryFromLatLon(float(row[17]), float(row[18])))
            footprint.save()
            source = Entity.objects.get(id=event.id)
            target = Entity.objects.get(id=footprint.id)
            rel = Relationship(
                    source=source,
                    target=target,
                    date_begin=formatDate(row[1]),
                    )
            rel.save()

def formatGeometryFromLatLon(lat, lon):
    return Point(lat, lon, srid='4326')

def formatDate(datestring):
# datestring: dd hhmmssZ mmm yyyy
    if (datestring != None and datestring != ""):
        return parser.parse(datestring)
    return

def formatGeometry(mgrsStr):
    # mgrs: mgrs format 
    if mgrsStr != None and mgrsStr != "":
        try:
            m = mgrs.MGRS()
            latlon = m.toLatLon(str(mgrsStr))
            return Point(latlon[1], latlon[0], srid='4326')
        except Exception as e:
            print "converting string %s error, " % mgrsStr, e
    return

def formatBool(boolstring):
    #boolstring: true or false
    return boolstring.lower() == "true"


