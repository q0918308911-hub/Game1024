const fs = require('fs');
const path = require('path');
const brotli = require('brotli');

const compressFile = (filePath) => {
    if (filePath.includes('.js') || filePath.includes('.html') || filePath.includes('.css')) {
        if (filePath.includes('.json')) {
            return;
        }
        const fileData = fs.readFileSync(filePath);
        const compressedData = brotli.compress(fileData);
        if (compressedData) {
            console.log(`Compressed ${filePath} to ${filePath}.br`);
            fs.writeFileSync(`${filePath}.br`, compressedData?.toString());
        }
    }
};

const compressDirectory = (dir) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.lstatSync(filePath);
        if (stat.isDirectory()) {
            compressDirectory(filePath);
        } else {
            compressFile(filePath);
        }
    });
};

const outputDir = path.join('./', 'build', 'web-mobile'); // 请根据您的输出目录调整路径
console.log(`Compressing files in ${outputDir}...`);
compressDirectory(outputDir);
