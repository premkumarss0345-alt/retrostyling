import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('./src');
let issues = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('<Link') && !content.includes('from \'react-router-dom\'') && !content.includes('from "react-router-dom"')) {
    console.error(`❌ Missing react-router-dom import in: ${file}`);
    issues++;
  } else if (content.includes('<Link') && !/import\s+.*?\bLink\b.*?from\s+['"]react-router-dom['"]/.test(content)) {
    console.error(`❌ Missing Link specifier in react-router-dom import in: ${file}`);
    issues++;
  }
}

if (issues === 0) {
  console.log('✅ All Link usages have valid imports!');
} else {
  console.log(`Found ${issues} files with missing Link imports.`);
}
