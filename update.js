// 一键更新：重新扫描源PDF -> 重建清单 -> 提交并推送到 GitHub Pages
// 由「更新网站.cmd」双击调用
const { execSync } = require('child_process');
const ROOT = __dirname;

function run(cmd) {
  console.log('> ' + cmd);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

console.log('=== 南京华用电气 · 产品手册 一键更新 ===\n');
try {
  run('node build.js');
  run('git add -A');
  let changed = true;
  try { execSync('git diff --cached --quiet', { cwd: ROOT }); changed = false; }
  catch (e) { changed = true; }
  if (changed) {
    run('git commit -m "更新产品手册"');
  } else {
    console.log('内容没有变化，无需提交。');
  }
  try {
    run('git push');
  } catch (e) {
    // 国内网络直连 github.com 偶尔被重置，本机代理可用时走代理重试
    console.log('直连推送失败，尝试通过本地代理 127.0.0.1:7890 重试…');
    run('git -c http.proxy=http://127.0.0.1:7890 push');
  }
  const cfg = require('./config.json');
  console.log('\n✓ 更新完成！线上网址：' + (cfg.siteUrl || '(尚未配置，见使用说明.txt)'));
  console.log('  GitHub Pages 生效约需 1 分钟，稍后刷新手机网页即可看到新内容。');
} catch (e) {
  console.error('\n✗ 更新失败：' + (e.message || e));
  console.error('  常见原因：首次使用需先登录 git 并配置远程仓库（见使用说明.txt）。');
  process.exitCode = 1;
}