const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('{app,components}/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/max-w-7xl/g, 'max-w-[1280px]')
    .replace(/max-w-6xl/g, 'max-w-[1152px]')
    .replace(/max-w-5xl/g, 'max-w-[1024px]')
    .replace(/max-w-4xl/g, 'max-w-[896px]')
    .replace(/max-w-3xl/g, 'max-w-[768px]')
    .replace(/max-w-2xl/g, 'max-w-[672px]')
    .replace(/max-w-xl/g, 'max-w-[576px]')
    .replace(/max-w-lg/g, 'max-w-[512px]')
    .replace(/max-w-md/g, 'max-w-[448px]')
    .replace(/max-w-sm/g, 'max-w-[384px]');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed', file);
  }
});
