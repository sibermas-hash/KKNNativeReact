# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# R13-MOBILE-007: reanimated keep rules removed — the package is not in
# package.json dependencies so the rule masked nothing. Re-add if we adopt
# react-native-reanimated later.

# TurboModules still used by React Native core.
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:
