# Документация по интеграциям Polza

Это руководство описывает архитектуру интеграций Polza AI с инструментами в @deep-assistant/agent, включая настройку провайдеров, использование инструментов и примеры конфигураций.

## Содержание

- [Архитектура интеграции](#архитектура-интеграции)
- [Настройка провайдеров](#настройка-провайдеров)
- [Инструменты Polza](#инструменты-polza)
- [Конфигурация API](#конфигурация-api)
- [Примеры интеграций](#примеры-интеграций)
- [Лучшие практики](#лучшие-практики)
- [Устранение неполадок](#устранение-неполадок)

## Архитектура интеграции

### Основные компоненты

```
┌─────────────────────────────────────────────────────────────┐
│                    Polza Agent CLI                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   OpenCode      │  │     Polza       │  │   Другие     │ │
│  │   Provider      │  │   Provider      │  │  провайдеры  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│              Provider Manager (src/provider/)               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ File Operations │  │  Search Tools   │  │  Execution   │ │
│  │ • read          │  │ • glob          │  │   Tools      │ │
│  │ • write         │  │ • grep          │  │ • bash       │ │
│  │ • edit          │  │ • websearch     │  │ • batch      │ │
│  │ • list          │  │ • codesearch    │  │ • task       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Provider Manager

Система управления провайдерами (`src/provider/provider.ts`) обеспечивает:

- **Динамическая загрузка SDK** для разных AI провайдеров
- **Унифицированный интерфейс** для работы с различными моделями
- **Автоматическая конфигурация** API ключей и параметров
- **Поддержка кастомных провайдеров** через плагинную систему

### Tool Registry

Реестр инструментов (`src/tool/registry.ts`) предоставляет:

- **13 встроенных инструментов** с полной функциональностью
- **OpenCode-совместимый формат** вывода
- **Автоматическая валидация** параметров через Zod схемы
- **Поддержка кастомных инструментов** через регистрацию

## Настройка провайдеров

### Polza Provider

Polza использует Claude модели через OpenAI-совместимый API:

```typescript
// Конфигурация в polza-config-example.json
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
            "output": 15,
            "cache_read": 0.3,
            "cache_write": 3.75
          },
          "limit": {
            "context": 200000,
            "output": 8192
          }
        }
      }
    }
  }
}
```

### OpenCode Provider

OpenCode предоставляет бесплатные модели через Zen API:

```typescript
// Автоматическая конфигурация в CUSTOM_LOADERS
opencode: async () => {
  const hasKey = await (async () => {
    if (input.env.some((item) => process.env[item])) return true
    if (await Auth.get(input.id)) return true
    return false
  })()

  if (!hasKey) {
    // Удаляем платные модели если нет ключа
    for (const [key, value] of Object.entries(input.models)) {
      if (value.cost.input === 0) continue
      delete input.models[key]
    }
  }

  return {
    autoload: Object.keys(input.models).length > 0,
    options: hasKey ? {} : { apiKey: "public" },
  }
}
```

### Другие провайдеры

Поддерживаются множество других провайдеров:

- **OpenAI**: GPT-4, GPT-5 модели
- **Anthropic**: Claude модели напрямую
- **Google**: Gemini, Vertex AI
- **AWS**: Bedrock модели
- **Azure**: OpenAI через Azure
- **OpenRouter**: Агрегатор моделей

## Инструменты Polza

### Файловые операции

#### read
Чтение файлов с поддержкой больших файлов:

```typescript
// Пример использования
echo '{"message":"read file","tools":[{"name":"read","params":{"file_path":"/path/to/file.txt"}}]}' | agent

// С Polza
echo '{"message":"read file","tools":[{"name":"read","params":{"file_path":"/path/to/file.txt"}}]}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

#### write
Запись файлов с автоматическим созданием директорий:

```typescript
// Пример использования
echo '{"message":"write file","tools":[{"name":"write","params":{"file_path":"/tmp/test.txt","content":"Hello World"}}]}' | agent
```

#### edit
Точное редактирование файлов через замену строк:

```typescript
// Пример использования
echo '{"message":"edit file","tools":[{"name":"edit","params":{"file_path":"/tmp/test.txt","old_string":"Hello","new_string":"Hi"}}]}' | agent
```

#### list
Список файлов и директорий:

```typescript
// Пример использования
echo '{"message":"list directory","tools":[{"name":"list","params":{"path":"."}}]}' | agent
```

### Поисковые инструменты

#### glob
Быстрый поиск файлов по паттернам:

```typescript
// Пример использования
echo '{"message":"find js files","tools":[{"name":"glob","params":{"pattern":"**/*.js"}}]}' | agent
```

#### grep
Мощный поиск по тексту с regex:

```typescript
// Пример использования
echo '{"message":"search pattern","tools":[{"name":"grep","params":{"pattern":"TODO","output_mode":"content"}}]}' | agent
```

#### websearch
Веб-поиск через Exa API (всегда включен):

```typescript
// Пример использования
echo '{"message":"search web","tools":[{"name":"websearch","params":{"query":"TypeScript latest features"}}]}' | agent

// С Polza для анализа результатов
echo '{"message":"search and analyze","tools":[{"name":"websearch","params":{"query":"React hooks best practices 2024"}}]}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

#### codesearch
Поиск по коду и документации:

```typescript
// Пример использования
echo '{"message":"search code","tools":[{"name":"codesearch","params":{"query":"React hooks implementation"}}]}' | agent
```

### Инструменты выполнения

#### bash
Выполнение shell команд с таймаутом:

```typescript
// Пример использования
echo '{"message":"run command","tools":[{"name":"bash","params":{"command":"echo hello world","description":"Print greeting"}}]}' | agent

// С Polza
echo '{"message":"analyze system","tools":[{"name":"bash","params":{"command":"ps aux | head -10","description":"Show running processes"}}]}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

#### batch
Пакетное выполнение инструментов:

```typescript
// Пример использования
echo '{"message":"run batch","tools":[{"name":"batch","params":{"tool_calls":[{"tool":"bash","parameters":{"command":"echo hello"}},{"tool":"bash","parameters":{"command":"echo world"}}]}}]}' | agent
```

#### task
Запуск специализированных агентов:

```typescript
// Пример использования
echo '{"message":"launch task","tools":[{"name":"task","params":{"description":"Analyze codebase","prompt":"Find all TODO comments in JavaScript files","subagent_type":"general-purpose"}}]}' | agent
```

### Утилитарные инструменты

#### todo
Управление задачами:

```typescript
// Пример использования
echo '{"message":"add todos","tools":[{"name":"todowrite","params":{"todos":[{"content":"Implement feature X","status":"pending","activeForm":"Implementing feature X"}]}}]}' | agent
```

#### webfetch
Получение и обработка веб-контента:

```typescript
// Пример использования
echo '{"message":"fetch url","tools":[{"name":"webfetch","params":{"url":"https://example.com","prompt":"Summarize the content"}}]}' | agent
```

## Конфигурация API

### Переменные окружения

```bash
# Polza API
export POLZA_API_KEY="ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo"

# OpenCode API (опционально)
export OPENCODE_API_KEY="your-opencode-key"

# Другие провайдеры
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
export GOOGLE_API_KEY="your-google-key"
```

### Файлы конфигурации

#### Глобальная конфигурация (.opencode/config.json)
```json
{
  "provider": {
    "polza": {
      "options": {
        "apiKey": "ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo"
      }
    }
  },
  "model": "polza/claude-sonnet-4.5"
}
```

#### Пользовательская конфигурация
```bash
# Использование пользовательского конфига
echo '{"message":"test"}' | OPENCODE_CONFIG=my-config.json agent --model polza/claude-sonnet-4.5
```

## Примеры интеграций

### Базовое использование с Polza

```bash
# Простое сообщение
echo "Привет, как дела?" | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5

# С инструментами
echo '{"message":"проанализируй проект","tools":[{"name":"list","params":{"path":"src"}},{"name":"glob","params":{"pattern":"**/*.ts"}}]}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

### Комплексная задача с Polza

```bash
# Создание нового компонента
echo '{
  "message": "Создай React компонент для формы входа",
  "tools": [
    {
      "name": "bash", 
      "params": {
        "command": "mkdir -p src/components/auth",
        "description": "Создать директорию для компонентов"
      }
    },
    {
      "name": "write",
      "params": {
        "file_path": "src/components/auth/LoginForm.tsx",
        "content": "import React, { useState } from \"react\";\n\ninterface LoginFormProps {\n  onSubmit: (credentials: { email: string; password: string }) => void;\n}\n\nexport const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {\n  const [email, setEmail] = useState(\"\");\n  const [password, setPassword] = useState(\"\");\n\n  const handleSubmit = (e: React.FormEvent) => {\n    e.preventDefault();\n    onSubmit({ email, password });\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <div>\n        <input\n          type=\"email\"\n          value={email}\n          onChange={(e) => setEmail(e.target.value)}\n          placeholder=\"Email\"\n          required\n        />\n      </div>\n      <div>\n        <input\n          type=\"password\"\n          value={password}\n          onChange={(e) => setPassword(e.target.value)}\n          placeholder=\"Password\"\n          required\n        />\n      </div>\n      <button type=\"submit\">Войти</button>\n    </form>\n  );\n};"
      }
    }
  ]
}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

### Анализ кода с Polza

```bash
# Анализ архитектуры проекта
echo '{
  "message": "Проанализируй архитектуру этого проекта и предложи улучшения",
  "tools": [
    {
      "name": "list",
      "params": {
        "path": "src"
      }
    },
    {
      "name": "read",
      "params": {
        "file_path": "package.json"
      }
    },
    {
      "name": "grep",
      "params": {
        "pattern": "import.*from",
        "output_mode": "files_with_matches"
      }
    }
  ]
}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

### Веб-исследование с Polza

```bash
# Исследование технологий
echo '{
  "message": "Исследуй современные подходы к state management в React и создай сравнительную таблицу",
  "tools": [
    {
      "name": "websearch",
      "params": {
        "query": "React state management 2024 Redux Zustand Jotai comparison",
        "numResults": 10
      }
    },
    {
      "name": "websearch", 
      "params": {
        "query": "React state management best practices performance",
        "numResults": 8
      }
    }
  ]
}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

## Лучшие практики

### 1. Выбор модели

```bash
# Для простых задач - бесплатные модели
echo "привет" | agent  # opencode/grok-code (бесплатно)

# Для сложных задач - Polza Claude
echo '{"message":"сложная задача","tools":[...]}' | OPENCODE_CONFIG=polza-config-example.json agent --model polza/claude-sonnet-4.5
```

### 2. Оптимизация инструментов

```bash
# Используйте batch для множественных операций
echo '{
  "message": "выполни несколько операций",
  "tools": [{
    "name": "batch",
    "params": {
      "tool_calls": [
        {"tool": "list", "parameters": {"path": "src"}},
        {"tool": "glob", "parameters": {"pattern": "**/*.ts"}},
        {"tool": "bash", "parameters": {"command": "find . -name \"*.test.ts\""}}
      ]
    }
  }]
}' | agent
```

### 3. Обработка ошибок

```bash
# Включите отладку для диагностики
DEBUG=true echo '{"message":"тест","tools":[{"name":"bash","params":{"command":"ls invalid_path"}}]}' | agent
```

### 4. Безопасность

```bash
# Не передавайте секреты в командах
# Плохо:
echo '{"message":"тест","tools":[{"name":"bash","params":{"command":"curl -H \"Authorization: Bearer secret_token\" https://api.example.com"}}]}' | agent

# Хорошо - используйте переменные окружения:
export API_TOKEN="secret_token"
echo '{"message":"тест","tools":[{"name":"bash","params":{"command":"curl -H \"Authorization: Bearer $API_TOKEN\" https://api.example.com"}}]}' | agent
```

## Устранение неполадок

### Частые проблемы

#### 1. Polza не отвечает

```bash
# Проверьте конфигурацию
cat polza-config-example.json

# Проверьте API ключ
echo $POLZA_API_KEY

# Тестируйте подключение
bun run test-polza-api.mjs
```

#### 2. Инструменты не работают

```bash
# Проверьте синтаксис JSON
echo '{"message":"тест","tools":[{"name":"bash","params":{"command":"echo hello"}}]}' | jq .

# Включите отладку
DEBUG=true echo '{"message":"тест"}' | agent
```

#### 3. Модель не найдена

```bash
# Проверьте доступные модели
agent --help

# Используйте правильный формат
agent --model polza/claude-sonnet-4.5  # Правильно
agent --model claude-sonnet-4.5        # Неправильно
```

#### 4. Проблемы с сетью

```bash
# Проверьте подключение к интернету
ping google.com

# Тестируйте API Polza
curl -H "Authorization: Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo" https://api.polza.ai/api/v1/models
```

### Диагностические команды

```bash
# Полная диагностика системы
echo '{"message":"diagnostic","tools":[{"name":"bash","params":{"command":"node --version && bun --version && which bun"}},{"name":"bash","params":{"command":"ls -la src/ | head -10"}},{"name":"bash","params":{"command":"cat package.json | grep -A 5 -B 5 \"dependencies\""}}]}' | agent

# Тест всех инструментов
for tool in bash read write edit list glob grep websearch codesearch batch task todo webfetch; do
  echo "Testing $tool tool..."
  echo "{\"message\":\"test $tool\",\"tools\":[{\"name\":\"$tool\",\"params\":{\"command\":\"echo test\"}}]}" | agent | jq -r 'select(.type=="text") | .part.text' | head -1
done
```

### Логи и отладка

```bash
# Включение подробных логов
DEBUG=provider,bash,websearch echo '{"message":"тест"}' | agent

# Сохранение логов в файл
echo '{"message":"тест"}' | agent 2> agent.log

# Анализ логов
cat agent.log | jq .
```

### Производительность

```bash
# Мониторинг использования ресурсов
echo '{"message":"тест","tools":[{"name":"bash","params":{"command":"time ls -la"}}]}' | agent

# Профилирование медленных операций
echo '{"message":"тест","tools":[{"name":"bash","params":{"command":"sleep 2 && echo done"}}]}' | agent
```

Эта документация покрывает все аспекты интеграции Polza с инструментами в @deep-assistant/agent. Для получения дополнительной информации см. исходный код в директории `src/`.