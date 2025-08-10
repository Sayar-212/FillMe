const fs = require('fs');
const path = require('path');

function fixImports(dir, depth = 0) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !['node_modules', '.next', '.git'].includes(file)) {
      fixImports(filePath, depth + 1);
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      // Replace components with relative path
      const componentsReplace = '../'.repeat(depth) + 'components';
      if (content.includes('components')) {
        content = content.replace(/@\/components/g, componentsReplace);
        changed = true;
      }
      
      // Replace lib with relative path  
      const libReplace = '../'.repeat(depth) + 'lib';
      if (content.includes('lib')) {
        content = content.replace(/@\/lib/g, libReplace);
        changed = true;
      }
      
      // Replace hooks with relative path
      const hooksReplace = '../'.repeat(depth) + 'hooks';
      if (content.includes('hooks')) {
        content = content.replace(/@\/hooks/g, hooksReplace);
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed: ${filePath}`);
      }
    }
  });
}

// Start from project root
fixImports('.');
console.log('Done fixing imports!');