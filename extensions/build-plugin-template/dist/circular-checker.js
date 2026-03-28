"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCircularCheck = runCircularCheck;
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
function runCircularCheck() {
    console.log(`[my-builder-logger] 🔍 開始進行循環依賴檢查...`);
    const SRC_DIR = path.join(Editor.Project.path, 'assets');
    if (!fs.existsSync(SRC_DIR)) {
        console.warn(`[my-builder-logger] ⚠️ 找不到場景資料夾：${SRC_DIR}`);
        return;
    }
    const args = [
        '--extensions', 'ts',
        '--circular', // 僅顯示循環依賴
        '--exclude', 'node_modules', // 避免誤掃
    ];
    const res = spawnSync('npx', ['madge', ...args, SRC_DIR], {
        encoding: 'utf8',
        cwd: SRC_DIR,
        shell: process.platform === 'win32',
    });
    // ------------------------------
    // 🔍 解析 madge 輸出
    // ------------------------------
    if (res.status !== 0) {
        const output = res.stdout || '';
        const lines = output.split(/\r?\n/).filter(l => l.trim().length > 0);
        console.warn('==================== 🔁 循環依賴明細 ====================');
        let groupCount = 0;
        // 🧩 搜尋檔案中引用的行號
        const findImportLines = (fromFile, targetFile) => {
            if (!fs.existsSync(fromFile)) {
                console.warn(`[找不到檔案] ${fromFile}`);
                return [];
            }
            const targetName = path.basename(targetFile, path.extname(targetFile)); // 例如 B.ts → "B"
            const content = fs.readFileSync(fromFile, 'utf8');
            const lines = content.split(/\r?\n/);
            const result = [];
            const importRegex = new RegExp(`\\b(import|require)\\b[^\\n]*\\b${targetName}\\b`, 'i');
            const useRegex = new RegExp(`\\b${targetName}\\b`, 'g');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // 忽略註解
                if (/^\s*\/\//.test(line))
                    continue;
                // 忽略多行註解（/* ... */ 或 /** ... */）
                if (/^\s*\/\*/.test(line)) {
                    while (i < lines.length && !/\*\//.test(lines[i])) {
                        i++;
                    }
                    continue;
                }
                // 找 import 或 require
                if (importRegex.test(line)) {
                    result.push(i + 1);
                    continue;
                }
                // 找使用變數的地方
                if (useRegex.test(line)) {
                    result.push(i + 1);
                }
            }
            return result;
        };
        const checkedPairs = new Set();
        for (const line of lines) {
            const match = line.match(/^\s*\d+\)\s*(.+)$/);
            if (!match)
                continue;
            const chain = match[1].trim();
            const files = chain.split('>').map(s => s.trim());
            if (files.length < 2)
                continue;
            groupCount++;
            console.warn(`第 ${groupCount} 組循環鏈：${files.map(f => path.basename(f)).join(' <> ')}`);
            for (let i = 0; i < files.length; i++) {
                const from = path.resolve(SRC_DIR, files[i]);
                const to = path.resolve(SRC_DIR, files[(i + 1) % files.length]);
                const pairKey = [path.basename(from), path.basename(to)].sort().join('|'); // ✅ 保證 A|B == B|A
                // ⚡ 已經處理過就跳過
                if (checkedPairs.has(pairKey))
                    continue;
                checkedPairs.add(pairKey);
                const linesFrom = findImportLines(from, to);
                const linesTo = findImportLines(to, from);
                if (linesFrom.length > 0)
                    console.warn(`    ↳ ${path.basename(from)} 使用 ${path.basename(to)} 的行數：${linesFrom.join(', ')}`);
                if (linesTo.length > 0)
                    console.warn(`    ↳ ${path.basename(to)} 使用 ${path.basename(from)} 的行數：${linesTo.join(', ')}`);
            }
        }
        if (groupCount === 0) {
            console.warn('⚠️ 無法自動解析 madge 輸出，完整輸出如下：');
            console.warn(output);
        }
        console.warn('==========================================================');
    }
    else {
        console.log(`[my-builder-logger] ✅ 沒有發現循環依賴。`);
    }
}
