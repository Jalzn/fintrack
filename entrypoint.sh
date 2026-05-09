#!/bin/sh
set -e

envsubst '${BACKEND_HOST} ${FRONTEND_HOST}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
