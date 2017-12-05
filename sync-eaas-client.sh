#!/bin/sh
set -eu

REPO="https://git.eaas.uni-freiburg.de/eaas/eaas-client.git"
NAME="eaas-client"

build() {
  mvn package
  cp --remove-destination -rT target/"$NAME"-*/ "$DEST/vendor/""$NAME"
  cp --remove-destination -rT target/"$NAME"-*/ "$DEST/admin/vendor/""$NAME"
}

add() {
  git add vendor/"$NAME"
  git add admin/vendor/"$NAME"
}

BASEDIR="$(dirname "$(readlink -f -- "$0")")"
BASENAME="$(basename "$(readlink -f -- "$0")")"
TEMPDIR="$(mktemp -d)"
DEST="$BASEDIR"

cd "$TEMPDIR"
git clone "$REPO" .
REV="$(git rev-parse HEAD)"
build
cd "$BASEDIR"
add
git commit -F - << EOF
Update $NAME (via \`$BASENAME\`)

Commit '$REV'
of $REPO
EOF
