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

// ============================================================
// Inject CSS preload hint to eliminate critical CSS chain
// CRA hashes filenames so we detect the actual file at build time
// ============================================================
console.log('🎨 Post-build: Injecting CSS preload hints...');
try {
  const cssDir = path.join(buildDir, 'static', 'css');
  const indexHtmlPath = path.join(buildDir, 'index.html');

  if (fs.existsSync(cssDir) && fs.existsSync(indexHtmlPath)) {
    // Find the main CSS bundle (main.*.css)
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.startsWith('main.') && f.endsWith('.css') && !f.endsWith('.map'));

    if (cssFiles.length > 0) {
      const mainCss = cssFiles[0];
      const preloadLink = `<link rel="preload" href="/static/css/${mainCss}" as="style">`;

      let html = fs.readFileSync(indexHtmlPath, 'utf8');

      // Only inject if not already present
      if (!html.includes(`href="/static/css/${mainCss}" as="style"`)) {
        // Insert preload just before the first <link rel="stylesheet"
        html = html.replace('<link ', `${preloadLink}\n    <link `);
        fs.writeFileSync(indexHtmlPath, html, 'utf8');
        console.log(`✅ Injected CSS preload: /static/css/${mainCss}`);
      } else {
        console.log(`ℹ️  CSS preload already present, skipping`);
      }
    } else {
      console.log('⚠️  No main CSS bundle found in build/static/css/');
    }
  } else {
    console.log('⚠️  build/static/css or build/index.html not found, skipping CSS preload injection');
  }
} catch (err) {
  console.error('❌ Error injecting CSS preload:', err.message);
}

console.log('✅ Post-build complete!');
