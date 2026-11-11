// 扫描源文件夹 -> 复制 PDF 到站点 pdfs/ -> 生成 manifest.json
// 由「更新网站.cmd」调用，也可单独运行：node build.js
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const SOURCE = config.source;
const PDF_DIR = path.join(ROOT, 'pdfs');

if (!fs.existsSync(SOURCE)) {
  console.error('✗ 找不到源文件夹：' + SOURCE);
  console.error('  请检查 config.json 里的 source 路径是否正确。');
  process.exit(1);
}

function parseTitle(filename) {
  const title = filename.replace(/\.pdf$/i, '');
  const m = title.match(/^[A-Za-z0-9()\-.]+/);
  const model = m ? m[0] : '';
  let name = title.slice(model.length).trim();
  if (!name) name = title;
  return { title, model, name };
}

function human(size) {
  if (size >= 1048576) return (size / 1048576).toFixed(1) + ' MB';
  return Math.max(1, Math.round(size / 1024)) + ' KB';
}

const collator = new Intl.Collator('zh-Hans-CN');

// 每次重建 pdfs/，保证与源文件夹完全一致（含删除）
fs.rmSync(PDF_DIR, { recursive: true, force: true });
fs.mkdirSync(PDF_DIR, { recursive: true });

const categories = [];
let total = 0;
let totalBytes = 0;

const catNames = fs.readdirSync(SOURCE, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort(collator.compare);

for (const cat of catNames) {
  const catSrc = path.join(SOURCE, cat);
  const files = fs.readdirSync(catSrc, { withFileTypes: true })
    .filter(f => f.isFile() && /\.pdf$/i.test(f.name))
    .map(f => f.name)
    .sort(collator.compare);
  if (!files.length) continue;

  const catOut = path.join(PDF_DIR, cat);
  fs.mkdirSync(catOut, { recursive: true });

  const products = [];
  for (const fn of files) {
    const src = path.join(catSrc, fn);
    const dest = path.join(catOut, fn);
    fs.copyFileSync(src, dest);
    const size = fs.statSync(dest).size;
    const { title, model, name } = parseTitle(fn);
    products.push({
      title, model, name,
      file: fn,
      path: 'pdfs/' + cat + '/' + fn,
      size,
      sizeText: human(size)
    });
    total++;
    totalBytes += size;
  }
  categories.push({ name: cat, count: products.length, products });
}

const manifest = {
  company: config.company,
  title: config.title,
  siteUrl: config.siteUrl || '',
  generated: new Date().toISOString(),
  total,
  totalSizeText: human(totalBytes),
  categoryCount: categories.length,
  categories
};

const json = JSON.stringify(manifest, null, 2);
fs.writeFileSync(path.join(ROOT, 'manifest.json'), json, 'utf8');
// 同时输出 JS 版本，让 index.html 双击(file://)也能直接读取，无需 fetch
fs.writeFileSync(path.join(ROOT, 'manifest.js'), 'window.__MANIFEST__ = ' + json + ';\n', 'utf8');
console.log('✓ 已同步 ' + total + ' 个 PDF / ' + categories.length + ' 个分类 / ' + human(totalBytes));