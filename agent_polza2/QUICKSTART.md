# Быстрый старт с Polza

Это краткое руководство поможет быстро начать работу с Polza AI в @deep-assistant/agent.

## Предварительные требования

- [Bun](https://bun.sh) >= 1.0.0
- Подключение к интернету
- API ключ Polza (включен в пример конфигурации)

## Быстрый старт за 30 секунд

### 1. Базовое использование

```bash
# Простое сообщение с Polza (Claude)
echo "Привет! Как дела?" | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5

# То же самое с OpenCode (бесплатно)
echo "Привет! Как дела?" | agent
```

### 2. С инструментами

```bash
# Анализ проекта с Polza
echo '{"message":"проанализируй этот проект","tools":[{"name":"list","params":{"path":"src"}},{"name":"read","params":{"file_path":"package.json"}}]}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5

# То же самое с OpenCode
echo '{"message":"проанализируй этот проект","tools":[{"name":"list","params":{"path":"src"}},{"name":"read","params":{"file_path":"package.json"}}]}' | agent
```

### 3. Веб-поиск и анализ

```bash
# Поиск информации с Polza
echo '{"message":"найди информацию о React 19 и проанализируй новые возможности","tools":[{"name":"websearch","params":{"query":"React 19 new features 2024","numResults":5}}]}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

## Основные команды

### Доступные модели

```bash
# Показать справку и доступные модели
agent --help

# Список всех моделей
echo "покажи доступные модели" | agent
```

### Популярные инструменты

| Инструмент | Описание | Пример |
|------------|----------|--------|
| `bash` | Выполнение команд | `{"tools":[{"name":"bash","params":{"command":"ls -la"}}]}` |
| `read` | Чтение файлов | `{"tools":[{"name":"read","params":{"file_path":"README.md"}}]}` |
| `write` | Запись файлов | `{"tools":[{"name":"write","params":{"file_path":"test.txt","content":"Hello"}}]}` |
| `list` | Список файлов | `{"tools":[{"name":"list","params":{"path":"src"}}]}` |
| `grep` | Поиск текста | `{"tools":[{"name":"grep","params":{"pattern":"TODO","output_mode":"content"}}]}` |
| `websearch` | Веб-поиск | `{"tools":[{"name":"websearch","params":{"query":"React hooks"}}]}` |
| `batch` | Пакетные операции | `{"tools":[{"name":"batch","params":{"tool_calls":[...]}}]}` |

## Конфигурация

### Готовая конфигурация Polza

Файл `polza-config-example.json` уже настроен с рабочим API ключом:

```json
{
  "provider": {
    "polza": {
      "npm": "@ai-sdk/openai-compatible",
      "api": "https://api.polza.ai/api/v1",
      "name": "Polza AI",
      "env": ["POLZA_API_KEY"],
      "options": {
        "apiKey": "ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo"
      },
      "models": {
        "claude-sonnet-4.5": {
          "id": "anthropic/claude-sonnet-4.5",
          "name": "Claude Sonnet 4.5",
          "cost": {
            "input": 3,
            "output": 15
          }
        }
      }
    }
  },
  "model": "polza/claude-sonnet-4.5"
}
```

### Собственная конфигурация

```bash
# Скопируйте пример
cp polza-config-example.json my-config.json

# Отредактируйте при необходимости
# nano my-config.json

# Используйте свою конфигурацию
echo "тест" | OPENCODE_CONFIG=my-config.json agent --model polza/claude-sonnet-4.5
```

## Типичные сценарии

### 1. Анализ кода

```bash
echo '{
  "message": "Проанализируй архитектуру этого проекта и предложи улучшения",
  "tools": [
    {"name": "list", "params": {"path": "src"}},
    {"name": "read", "params": {"file_path": "package.json"}},
    {"name": "grep", "params": {"pattern": "export.*function", "output_mode": "files_with_matches"}}
  ]
}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

### 2. Создание компонента

```bash
echo '{
  "message": "Создай React компонент для загрузки файлов с прогресс-баром",
  "tools": [
    {"name": "bash", "params": {"command": "mkdir -p src/components"}},
    {"name": "write", "params": {
      "file_path": "src/components/FileUploader.tsx",
      "content": "import React, { useState, useRef } from \"react\";\n\ninterface FileUploaderProps {\n  onFileSelect: (file: File) => void;\n}\n\nexport const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {\n  const [progress, setProgress] = useState(0);\n  const fileInputRef = useRef<HTMLInputElement>(null);\n\n  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {\n    const file = event.target.files?.[0];\n    if (file) {\n      onFileSelect(file);\n      // Имитация загрузки\n      setProgress(0);\n      const interval = setInterval(() => {\n        setProgress(prev => {\n          if (prev >= 100) {\n            clearInterval(interval);\n            return 100;\n          }\n          return prev + 10;\n        });\n      }, 200);\n    }\n  };\n\n  return (\n    <div>\n      <input\n        type=\"file\"\n        ref={fileInputRef}\n        onChange={handleFileChange}\n        style={{ display: \"none\" }}\n      />\n      <button onClick={() => fileInputRef.current?.click()}>\n        Выбрать файл\n      </button>\n      {progress > 0 && (\n        <div>\n          <div>Загрузка: {progress}%</div>\n          <div style={{width: \"200px\", height: \"20px\", backgroundColor: \"#eee\"}}>\n            <div style={{width: `${progress}%`, height: \"100%\", backgroundColor: \"#007bff\"}}></div>\n          </div>\n        </div>\n      )}\n    </div>\n  );\n};"\n    }}\n  ]\n}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

### 3. Веб-исследование

```bash
echo '{
  "message": "Исследуй лучшие практики React в 2024 году и создай чек-лист",
  "tools": [
    {"name": "websearch", "params": {"query": "React best practices 2024 performance optimization", "numResults": 8}},
    {"name": "websearch", "params": {"query": "React hooks patterns 2024 state management", "numResults": 6}}\n  ]\n}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

### 4. Отладка и диагностика

```bash
echo '{
  "message": "Диагностируй проблемы производительности в этом проекте",
  "tools": [
    {"name": "bash", "params": {"command": "npm run build 2>&1 | head -20"}},
    {"name": "bash", "params": {"command": "du -sh node_modules/"}},
    {"name": "grep", "params": {"pattern": "console\\.log", "output_mode": "count"}}\n  ]\n}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

## Полезные команды

### Тестирование

```bash
# Тест Polza API
bun run test-polza-api.mjs

# Тест SDK
bun run test-sdk.mjs

# Полная диагностика
echo '{"message":"диагностика","tools":[{"name":"bash","params":{"command":"node --version && bun --version"}},{"name":"bash","params":{"command":"curl -s -o /dev/null -w \"%{http_code}\" https://api.polza.ai/api/v1/models"}}]}' | agent
```

### Отладка

```bash
# Включить подробные логи
DEBUG=true echo "тест" | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5

# Сохранить вывод в файл
echo "тест" | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5 > output.log

# Фильтровать JSON вывод
echo "тест" | agent | jq 'select(.type=="text") | .part.text'
```

## Часто задаваемые вопросы

### Q: Какой провайдер лучше использовать?
**A:** 
- **Polza (Claude)**: Для сложных задач, анализа кода, программирования
- **OpenCode (Grok)**: Для простых задач, бесплатное использование

### Q: Почему Polza не отвечает?
**A:** Проверьте:
1. Подключение к интернету
2. Правильность конфигурации: `cat polza-config-example.json`
3. Доступность API: `curl -H "Authorization: Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo" https://api.polza.ai/api/v1/models`

### Q: Как добавить новые инструменты?
**A:** См. полную документацию в `INTEGRATIONS.md` раздел "Кастомные инструменты".

### Q: Можно ли использовать без конфигурации?
**A:** Да, OpenCode модели работают без дополнительной настройки:
```bash
echo "привет" | agent  # Использует opencode/grok-code бесплатно
```

## Следующие шаги

1. 📖 Прочитайте полную документацию: `INTEGRATIONS.md`
2. 🔧 Изучите примеры: `EXAMPLES.md`
3. 🧪 Запустите тесты: `bun test`
4. 💡 Посмотрите кейс-стади: `docs/case-studies/`

---

**Нужна помощь?** Откройте issue в репозитории или изучите исходный код в `src/`.
