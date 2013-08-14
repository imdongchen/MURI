#!/bin/bash
set -e
NUM_WORKERS=3
VE_DIR="/Users/spatial/.virtualenvs/muri"
PROJECT_DIR="/Users/spatial/Deployment/MURI/eventviewer"
# user/group to run as
USER=spatial
source $VE_DIR/bin/activate
cd $PROJECT_DIR
exec $VE_DIR/bin/gunicorn_django -b 0.0.0.0:9003 -w $NUM_WORKERS \
    --user=$USER --log-level=info \
    --log-file=-
