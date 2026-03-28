#!/bin/bash
# 壓縮所有 .astc 成 .gz
find "$1" -type f -name "*.astc" | while read file; do
    gzip -9 -c "$file" > "$file.gz"
done

echo "✅ ASTC 壓縮完成"