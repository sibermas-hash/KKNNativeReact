#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
source ./setup-android-env.sh
export NODE_ENV="${NODE_ENV:-development}"
PACKAGE_NAME="ac.id.uinsaizu.kkn"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Check Android SDK installation." >&2
  exit 1
fi

if ! adb devices | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit found ? 0 : 1 }'; then
  echo "No running Android emulator/device found." >&2
  echo "Start an emulator from Android Studio, then run ./build-android.sh again." >&2
  if command -v emulator >/dev/null 2>&1; then
    echo
    echo "Available AVDs:"
    emulator -list-avds || true
  fi
  exit 1
fi

if [ "${RESET_ANDROID_APP:-0}" = "1" ]; then
  echo "Removing existing debug install for $PACKAGE_NAME..."
  adb uninstall "$PACKAGE_NAME" >/dev/null 2>&1 || true
fi

adb reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true
rm -rf android/app/build/generated/autolinking android/build/generated/autolinking

pnpm exec expo install --check
echo
echo "Starting Android debug build. Keep this terminal open while testing; the debug APK loads JavaScript from Metro."
pnpm exec expo run:android "$@"
