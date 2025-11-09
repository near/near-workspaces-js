#!/usr/bin/env node

/**
 * Post-build script to add .js extensions to all relative imports in ESM build
 * This is necessary because Node.js ESM requires explicit file extensions
 */

const fs = require('fs');
const path = require('path');

const esmDir = path.join(__dirname, '../dist/esm');

function addJsExtensions(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      addJsExtensions(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace relative imports without extensions with .js extension
      // Matches: from './something' or from "../something" or from './something/something'
      content = content.replace(
        /(from\s+['"])(\.\.[\/\\][^'"]+|\.\/[^'"]+)(['"])/g,
        (match, prefix, importPath, suffix) => {
          // Don't add .js if it already has an extension
          if (importPath.match(/\.\w+$/)) {
            return match;
          }
          
          // Check if this import path refers to a directory with an index file
          const currentDir = path.dirname(filePath);
          const resolvedPath = path.resolve(currentDir, importPath);
          
          if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
            // It's a directory, add /index.js
            return `${prefix}${importPath}/index.js${suffix}`;
          }
          
          // It's a file, add .js
          return `${prefix}${importPath}.js${suffix}`;
        }
      );
      
      // Also handle export statements
      content = content.replace(
        /(export\s+\*\s+from\s+['"])(\.\.[\/\\][^'"]+|\.\/[^'"]+)(['"])/g,
        (match, prefix, importPath, suffix) => {
          if (importPath.match(/\.\w+$/)) {
            return match;
          }
          
          // Check if this import path refers to a directory with an index file
          const currentDir = path.dirname(filePath);
          const resolvedPath = path.resolve(currentDir, importPath);
          
          if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
            // It's a directory, add /index.js
            return `${prefix}${importPath}/index.js${suffix}`;
          }
          
          // It's a file, add .js
          return `${prefix}${importPath}.js${suffix}`;
        }
      );
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

function fixExternalImports(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixExternalImports(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Handle external module deep imports that need .js extensions
      // Match patterns like 'near-api-js/lib/utils/rpc_errors' but NOT 'near-api-js'
      // For scoped packages: @scope/package/path -> needs .js
      // For regular packages: package/path -> needs .js  
      content = content.replace(
        /((?:import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from|export\s+(?:\{[^}]*\}|\*)\s+from)\s+['"])(@[^/]+\/[^/]+\/[^'"]+|(?!(?:\.\/|\.\.|@))[^/'"]+\/[^'"]+)(['"])/g,
        (match, prefix, importPath, suffix) => {
          // Don't add .js if it already has an extension
          if (importPath.match(/\.\w+$/)) {
            return match;
          }
          
          // Try to resolve the path to see if it's a directory
          try {
            const resolvedPath = require.resolve(importPath, { paths: [path.dirname(filePath)] });
            // If it resolves, check if the original import points to a directory
            const pathParts = importPath.split('/');
            const packageEndIndex = importPath.startsWith('@') ? 2 : 1;
            const subpath = pathParts.slice(packageEndIndex).join('/');
            
            // Try to find the package in node_modules
            let searchPath = path.dirname(filePath);
            while (searchPath !== path.dirname(searchPath)) {
              const testPath = path.join(searchPath, 'node_modules', importPath);
              if (fs.existsSync(testPath) && fs.statSync(testPath).isDirectory()) {
                // It's a directory, add /index.js
                return `${prefix}${importPath}/index.js${suffix}`;
              }
              searchPath = path.dirname(searchPath);
            }
          } catch (e) {
            // If resolution fails, just add .js
          }
          
          // Add .js to module subpath imports
          return `${prefix}${importPath}.js${suffix}`;
        }
      );
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

if (fs.existsSync(esmDir)) {
  console.log('Adding .js extensions to ESM imports...');
  addJsExtensions(esmDir);
  console.log('Fixing external module imports...');
  fixExternalImports(esmDir);
  console.log('✓ Done!');
} else {
  console.warn('ESM directory not found:', esmDir);
  process.exit(1);
}
