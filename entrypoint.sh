#!/bin/sh
set -e

RESOLVER_ADDR=$(awk '/^nameserver/ {print $2; exit}' /etc/resolv.conf)
case "$RESOLVER_ADDR" in
  *:*) RESOLVER_ADDR="[$RESOLVER_ADDR]" ;;
esac
export RESOLVER_ADDR

echo "Detected resolver: $RESOLVER_ADDR"
cat /etc/resolv.conf

envsubst '${BACKEND_HOST} ${FRONTEND_HOST} ${RESOLVER_ADDR}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
