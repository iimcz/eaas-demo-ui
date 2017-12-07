#!/bin/sh
set -eu

REPO="https://git.eaas.uni-freiburg.de/eaas/eaas-client.git"
NAME="eaas-client"

build() {
  mvn package
  rm -rf "$DEST/vendor/""$NAME"
  cp -R target/"$NAME"-*/ "$DEST/vendor/""$NAME"
  rm -rf "$DEST/admin/vendor/""$NAME"
  cp -R target/"$NAME"-*/ "$DEST/admin/vendor/""$NAME"
}

add() {
  git add vendor/"$NAME"
  git add admin/vendor/"$NAME"
}


abspath()
{
    if [ -d "$1" ]
    then
        cd "$1" &> '/dev/null' && echo "$(pwd -P)" && exit 0
    else
        cd &> '/dev/null' "$(dirname "$1")" && echo "$(pwd -P)/$(basename "$1")" && exit 0
    fi
    exit 30
}

BASEDIR="$(dirname "$(abspath "$0")")"
BASENAME="$(basename "$(abspath "$0")")"
TEMPDIR="$(mktemp -d)"
DEST="$BASEDIR"

cd "$TEMPDIR"
git clone "$REPO" .
REV="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short=10 HEAD)"
build
cd "$BASEDIR"
add
git commit -F - << EOF
Update $NAME ('$SHORT')

Via \`$BASENAME\`.

Commit '$REV'
of $REPO
EOF
