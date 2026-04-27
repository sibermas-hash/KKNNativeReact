const fs = require('fs');

const filePath = '/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Academic/Evaluations/Index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

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

console.log("Checking variants match...");
const varMatch = content.match(/(return\s*\(\s*<AppLayout[^>]*>)/);
console.log("varMatch:", !!varMatch);
if (varMatch) {
    content = content.replace(/(return\s*\(\s*<AppLayout[^>]*>)/, variants + "$1");
}

console.log("Checking appLayoutMatch...");
const appLayoutMatch = content.match(/(<AppLayout[^>]*>[\s\S]*?)(<div\s+className="[^"]+">)/);
console.log("appLayoutMatch:", !!appLayoutMatch);
if (appLayoutMatch) {
    const fullMatch = appLayoutMatch[0];
    const pre = appLayoutMatch[1];
    const div = appLayoutMatch[2];
    const newDiv = div.replace('<div', '<motion.div variants={containerVariants} initial="hidden" animate="show"');
    
    content = content.replace(fullMatch, pre + newDiv);
    
    console.log("Checking endLayoutMatch...");
    const endLayoutMatch = content.match(/<\/div>\s*<\/AppLayout>/);
    console.log("endLayoutMatch:", !!endLayoutMatch);
    if (endLayoutMatch) {
        content = content.replace(/<\/div>(\s*<\/AppLayout>)/, '</motion.div>$1');
    }
}

if (!content.includes("import { motion }")) {
    content = content.replace(/(import .*?;)/, "$1\nimport { motion } from 'framer-motion';");
}

content = content.replace(/(<PageHeader[\s\S]*?<\/PageHeader>)/g, "<motion.div variants={itemVariants}>\n$1\n</motion.div>");
content = content.replace(/(<ContentPanel[\s\S]*?<\/ContentPanel>)/g, "<motion.div variants={itemVariants}>\n$1\n</motion.div>");

fs.writeFileSync(filePath, content, 'utf8');
console.log("WROTE FILE");
