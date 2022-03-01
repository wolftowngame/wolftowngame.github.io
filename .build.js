const fs = require('fs');
const path = require('path');

// 目录获取
const dir = path.join(__dirname, 'docs');

// 获取html文件
const FileStr = fs.readFileSync(path.join(dir, 'index.html'), 'utf-8');

const pages = ['debug.html'];

pages.forEach((item) => {
  fs.writeFile(path.join(dir, item), FileStr, (err) => {
    if (err) throw err;
  });
});
