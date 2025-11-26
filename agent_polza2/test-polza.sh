#!/bin/bash

# Скрипт для быстрого тестирования Polza модели

echo "🧪 Тестирование Polza (Claude) модели..."
echo "========================================"

# Тест 1: Кто я?
echo "Тест 1: Базовая идентификация"
echo 'ты кто?' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5
echo ""

# Тест 2: Программирование
echo "Тест 2: Программирование"
echo 'напиши функцию на Python для вычисления факториала' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5
echo ""

# Тест 3: Работа с файлами
echo "Тест 3: Работа с файлами"
echo 'покажи содержимое файла README.md' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5
echo ""

echo "✅ Тестирование Polza завершено!"