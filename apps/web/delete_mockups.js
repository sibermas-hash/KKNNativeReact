const fs = require('fs');

const filesToRemove = [
  '/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/src/app/(admin)/admin/akademik/nilai/page.tsx',
  '/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/src/app/(admin)/admin/akademik/yudisium/page.tsx',
  '/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/src/app/(admin)/admin/mahasiswa/sinkronisasi/page.tsx',
  '/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/src/app/(admin)/admin/nilai/rekap/page.tsx',
  '/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/src/app/(admin)/admin/pengaturan/penilaian/page.tsx'
];

for (const file of filesToRemove) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`Deleted: ${file}`);
  }
}
