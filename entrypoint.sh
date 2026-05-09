#!/bin/sh
set -e

echo "[entrypoint] Starting nginx-proxy setup..."

# Small delay to allow Railway to inject all environment variables
sleep 2

echo "[entrypoint] BACKEND_HOST=${BACKEND_HOST}"
echo "[entrypoint] FRONTEND_HOST=${FRONTEND_HOST}"

if [ -z "${BACKEND_HOST}" ]; then
  echo "[entrypoint] WARNING: BACKEND_HOST is empty — backend proxy will be broken"
fi

if [ -z "${FRONTEND_HOST}" ]; then
  echo "[entrypoint] WARNING: FRONTEND_HOST is empty — frontend proxy will be broken"
fi

envsubst '${BACKEND_HOST} ${FRONTEND_HOST}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "[entrypoint] Generated /etc/nginx/nginx.conf:"
cat /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
