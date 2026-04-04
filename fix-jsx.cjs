const fs = require('fs');
const path = require('path');
const glob = require('glob');

const patterns = [
  // Pattern 1: <div className="..." followed by a component tag
  {
    regex: /<div className="([^"]*)\n(\s*)<([A-Z])/g,
    replace: '<div className="$1">\n$2<$3'
  },
  // Pattern 2: <span className="..." followed by a component tag
  {
    regex: /<span className="([^"]*)\n(\s*)<([A-Z])/g,
    replace: '<span className="$1">\n$2<$3'
  },
  // Pattern 3: <div className="..." followed by a closing tag or other common JSX
  {
    regex: /<div className="([^"]*)\n(\s*)<\/div>/g,
    replace: '<div className="$1">\n$2</div>'
  },
  // Pattern 4: <div className="..." followed by a normal tag
  {
    regex: /<div className="([^"]*)\n(\s*)<div/g,
    replace: '<div className="$1">\n$2<div'
  },
  // Pattern 5: specific case for <p> tags
  {
    regex: /<p className="([^"]*)\n(\s*)Portal KKN/g,
    replace: '<p className="$1">\n$2Portal KKN'
  },
  {
    regex: /<p className="([^"]*)\n(\s*)Lembaga/g,
    replace: '<p className="$1">\n$2Lembaga'
  },
  // Pattern 6: truncated lines with ... r...
  {
    regex: /blur-\[120px\] -\/2 translate-x-1\/4/g,
    replace: 'blur-[120px]'
  },
  // Pattern 7: border-slate-200rounded-lg
  {
    regex: /border-slate-200rounded-lg/g,
    replace: 'border-slate-200 rounded-lg'
  },
  // Pattern 8: bg-whitevia-white
  {
    regex: /bg-whitevia-white/g,
    replace: 'bg-white via-white'
  },
  // Pattern 9: bg-whitevia-primary\/30
  {
    regex: /bg-whitevia-primary\/30/g,
    replace: 'bg-white via-primary/30'
  }
];

const files = glob.sync('resources/js/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  patterns.forEach(p => {
    content = content.replace(p.regex, p.replace);
  });
  
  if (content !== original) {
    console.log(`Fixed ${file}`);
    fs.writeFileSync(file, content);
  }
});
