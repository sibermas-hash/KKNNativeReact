#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
source ./setup-android-env.sh

if ! adb devices | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit found ? 0 : 1 }'; then
  echo "No running Android emulator/device found." >&2
  echo "Start an emulator from Android Studio, then run ./logs-android.sh again." >&2
  exit 1
fi

PACKAGE_NAME="ac.id.uinsaizu.kkn"

adb reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true

if ! lsof -nP -iTCP:8081 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Metro is not running on port 8081; a debug app may show 'Unable to load script'." >&2
  echo "Run ./start-android.sh in another terminal before checking runtime JS logs." >&2
  echo >&2
fi

adb logcat -c
adb shell monkey -p "$PACKAGE_NAME" 1 >/dev/null
sleep 4

adb logcat -d \
  ReactNativeJS:V \
  AndroidRuntime:E \
  Expo:E \
  ActivityTaskManager:W \
  "$PACKAGE_NAME":V \
  '*:S'
