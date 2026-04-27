#!/bin/bash
cd /Users/macm4/Documents/KKN/kknuinsaizu

# Hapus origin lama jika ada
git remote remove origin 2>/dev/null

# Tambahkan origin baru menggunakan token
git remote add origin https://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@github.com/putrihati-cmd/kknuinsaizu.git

# Set branch utama ke main
git branch -M main

# Tambahkan perubahan terakhir
git add .
git commit -m "Update konfigurasi remote repo" 2>/dev/null

# Push ke GitHub
git push -u origin main
