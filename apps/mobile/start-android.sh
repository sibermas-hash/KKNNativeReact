#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
source ./setup-android-env.sh

if ! adb devices | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit found ? 0 : 1 }'; then
  echo "No running Android emulator/device found." >&2
  echo "Start an emulator from Android Studio, then run ./start-android.sh again." >&2
  exit 1
fi

adb reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true

echo "Starting Metro for Android. Keep this terminal open while using the debug app."
pnpm exec expo start --dev-client --android --clear
