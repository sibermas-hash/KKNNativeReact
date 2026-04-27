const fs = require('fs');
const path = require('path');

const variants = `  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  };

`;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('containerVariants')) return;

    let modified = false;

    if (!content.includes("import { motion }")) {
        content = content.replace(/(import .*?;)/, "$1\nimport { motion } from 'framer-motion';");
        modified = true;
    }

    // Insert variants right before `return (` that precedes <AppLayout
    if (content.includes('return (') && content.includes('<AppLayout')) {
        content = content.replace(/(return\s*\(\s*<AppLayout[^>]*>)/, variants + "$1");
        modified = true;
    }

    // Main wrapper replacement: Find <AppLayout...> and the very next <div ...>
    const appLayoutMatch = content.match(/(<AppLayout[^>]*>[\s\S]*?)(<div\s+className="[^"]+">)/);
    if (appLayoutMatch) {
        const fullMatch = appLayoutMatch[0];
        const pre = appLayoutMatch[1];
        const div = appLayoutMatch[2];
        const newDiv = div.replace('<div', '<motion.div variants={containerVariants} initial="hidden" animate="show"');
        
        content = content.replace(fullMatch, pre + newDiv);
        
        // Find the last </div> before </AppLayout>
        const endLayoutMatch = content.match(/<\/div>\s*<\/AppLayout>/);
        if (endLayoutMatch) {
            content = content.replace(/<\/div>(\s*<\/AppLayout>)/, '</motion.div>$1');
            modified = true;
        }
    }

    // Wrap elements
    if (modified) {
        content = content.replace(/(<PageHeader[\s\S]*?<\/PageHeader>)/g, "<motion.div variants={itemVariants}>\n$1\n</motion.div>");
        content = content.replace(/(<ContentPanel[\s\S]*?<\/ContentPanel>)/g, "<motion.div variants={itemVariants}>\n$1\n</motion.div>");
        
        // The grid regex safely wrapping with variants={itemVariants}
        content = content.replace(/(<div className="grid[^"]*gap-4[^"]*">)/g, '<motion.div variants={itemVariants} className="$1"'.replace('className="<div className="', 'className="'));
        content = content.replace(/(<motion\.div variants=\{itemVariants\} className="grid[^"]*gap-4[^"]*">[\s\S]*?)(<\/div>)/g, '$1</motion.div>');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log("✔ Animasi berhasil disuntikkan: " + filePath.split('/resources/')[1]);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file === 'Index.tsx') {
            processFile(fullPath);
        }
    }
}

console.log("Memulai proses injeksi animasi Framer Motion secara massal...");
walkDir('/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin');
console.log("Selesai! ✨ Silakan cek halaman Anda.");
