#!/bin/bash

echo "🚀 Mempersiapkan Lingkungan Mobile SIBERMAS..."

# 1. Pastikan folder platform ada
if [ ! -d "android" ]; then
    echo "📦 Menambahkan platform Android..."
    npx cap add android
fi

if [ ! -d "ios" ]; then
    echo "📦 Menambahkan platform iOS..."
    npx cap add ios
fi

# 2. Sinkronisasi aset
echo "🔄 Sinkronisasi aset Web ke Mobile..."
npm run build
npx cap sync

echo "✅ Selesai! Gunakan perintah berikut untuk membuka IDE:"
echo "👉 npm run mobile:open:android"
echo "👉 npm run mobile:open:ios"
