#!/bin/bash

# Pindah ke direktori tempat script ini berada (root proyek)
cd "$(dirname "$0")"

# Cek apakah ada perubahan dalam repository
if [[ -z $(git status -s) ]]; then
  echo "✅ Tidak ada perubahan kode untuk di-commit."
  exit 0
fi

echo "Mendeteksi perubahan kode..."

# Tambahkan semua perubahan ke staging area
git add .

# Buat pesan commit default dengan timestamp
COMMIT_MSG="Auto commit: Update codebase - $(date +'%Y-%m-%d %H:%M:%S')"

# Jika pengguna memasukkan pesan argumen saat menjalankan script, gunakan pesan tersebut
if [ ! -z "$1" ]; then
  COMMIT_MSG="$1"
fi

# Jalankan proses commit
git commit -m "$COMMIT_MSG"

# Push ke remote repository (branch main)
echo "Mulai mengirim (push) kode ke repositori GitHub origin/main..."
git push origin main

echo "✅ Proses Auto-Commit berhasil diselesaikan!"
