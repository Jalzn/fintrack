#!/bin/sh
set -e

RESOLVER_ADDR=$(awk '/^nameserver/ {print $2; exit}' /etc/resolv.conf)
export RESOLVER_ADDR

echo "Detected resolver: $RESOLVER_ADDR"
cat /etc/resolv.conf

envsubst '${BACKEND_HOST} ${FRONTEND_HOST} ${RESOLVER_ADDR}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
