#!/usr/bin/env bash
set -euo pipefail

SDK_DIR="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

if [ ! -d "$SDK_DIR" ]; then
  echo "Android SDK not found at: $SDK_DIR" >&2
  echo "Install Android Studio SDK, or set ANDROID_HOME before running this script." >&2
  exit 1
fi

export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/cmdline-tools/bin:$PATH"

IS_SOURCED=false
if [ -n "${BASH_VERSION:-}" ]; then
  [ "${BASH_SOURCE[0]}" != "$0" ] && IS_SOURCED=true
elif [ -n "${ZSH_VERSION:-}" ]; then
  case "${ZSH_EVAL_CONTEXT:-}" in
    *:file) IS_SOURCED=true ;;
  esac
fi

if [ "$IS_SOURCED" != "true" ]; then
  echo "Android environment configured for this command."
  echo "ANDROID_HOME=$ANDROID_HOME"
  echo "ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT"
  echo
  echo "To persist these variables in your current terminal, run:"
  echo "  source ./setup-android-env.sh"
  echo
  if command -v adb >/dev/null 2>&1; then
    adb devices -l
  else
    echo "adb not found after configuring PATH." >&2
    exit 1
  fi
fi
