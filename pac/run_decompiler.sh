#!/bin/bash

echo "=== ДЕКОМПИЛЯЦИЯ PAC ФАЙЛА ==="
echo "Доступные скрипты:"
echo "1. Python декомпилятор: pac_decompiler.py"
echo "2. Node.js декомпилятор: pac_reader.js"
echo ""

# Проверяем наличие Python
if command -v python3 &> /dev/null; then
    echo "✓ Python3 найден"
    echo "Запуск Python декомпилятора:"
    echo "python3 pac_decompiler.py pac.pac"
    echo ""
    python3 pac_decompiler.py pac.pac
else
    echo "✗ Python3 не найден"
fi

echo ""
echo "=========================================="

# Проверяем наличие Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js найден"
    echo "Запуск Node.js декомпилятора:"
    echo "node pac_reader.js pac.pac"
    echo ""
    node pac_reader.js pac.pac
else
    echo "✗ Node.js не найден"
fi

echo ""
echo "=========================================="
echo "После запуска будут созданы файлы:"
echo "- pac_rules.json - извлеченные правила в JSON формате"