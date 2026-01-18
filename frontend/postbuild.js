const fs = require('fs');
const path = require('path');

// Files to copy from public to build
const filesToCopy = ['_redirects', '.htaccess', 'netlify.toml', 'vercel.json'];

const publicDir = path.join(__dirname, 'public');
const buildDir = path.join(__dirname, 'build');

console.log('📋 Post-build: Copying configuration files...');

filesToCopy.forEach(file => {
  const src = path.join(publicDir, file);
  const dest = path.join(buildDir, file);
  
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`✅ Copied ${file} to build folder`);
    } else {
      console.log(`⚠️  ${file} not found in public folder`);
    }
  } catch (err) {
    console.error(`❌ Error copying ${file}:`, err.message);
  }
});

console.log('✅ Post-build complete!');
