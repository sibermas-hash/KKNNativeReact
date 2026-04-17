const sdgNames = {
  '1': 'Tanpa Kemiskinan',
  '2': 'Tanpa Kelaparan',
  '3': 'Kehidupan Sehat dan Sejahtera',
};
const sdg_distribution = {1: 0, 2: 0, 3: 3};
Object.entries(sdg_distribution).map(([sdg, count]) => {
  console.log(`SDG ${sdg}: ${sdgNames[sdg]}`);
});
