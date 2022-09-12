#!/bin/sh
selfdir="$(dirname -- "$(realpath -- "$0")")"
cd -- "$selfdir"

CONFIG_JSON_URL="${1-}"

echoexec() {
  printf '%s\n' "$*"
  "$@"
}

if ! test "$CONFIG_JSON_URL" && ! test -e eaas-frontend-admin/src/public/config.json; then
  printf "URL of instance (will be used to get config.json): "
  read -r CONFIG_JSON_URL
fi

if test "$CONFIG_JSON_URL"; then
  CONFIG_JSON_URL="${CONFIG_JSON_URL#http*://}"
  CONFIG_JSON_URL="${CONFIG_JSON_URL%%/*}"
  CONFIG_JSON_URL="${CONFIG_JSON_URL#*@}"
  CONFIG_JSON_URL="https://$CONFIG_JSON_URL/admin/config.json"
  echoexec curl -Lo eaas-frontend-admin/src/public/config.json  -- "$CONFIG_JSON_URL"
fi

npm ci --legacy-peer-deps
cd eaas-frontend-admin
npm ci --legacy-peer-deps
npm start
