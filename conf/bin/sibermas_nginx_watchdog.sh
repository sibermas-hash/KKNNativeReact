#!/bin/sh

set -eu

interval="${1:-5}"

while :; do
    if service nginx onestatus >/dev/null 2>&1; then
        sleep "${interval}"
        continue
    fi

    ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

    if nginx -t >/dev/null 2>&1; then
        echo "${ts} nginx down; attempting restart"
        if service nginx onestart >/dev/null 2>&1 || service nginx start >/dev/null 2>&1; then
            echo "${ts} nginx restarted"
        else
            echo "${ts} nginx restart command failed"
        fi
    else
        echo "${ts} nginx config invalid; restart skipped"
    fi

    sleep "${interval}"
done
