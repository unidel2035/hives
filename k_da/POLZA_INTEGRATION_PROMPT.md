# Промпт для Claude AI: Интеграция Polza AI в k_da CLI

## Задача

Интегрировать Polza AI как альтернативного провайдера в k_da CLI с возможностью выбора между Polza AI и Kodacode API, особенно для использования Claude моделей.

## Текущее состояние

### Что уже есть:
- ✅ `POLZA_API_KEY` в `.env` файле
- ✅ Базовый код Polza клиента в `build.js` (строки 89-120)
- ✅ Проверка `POLZA_API_KEY` в рантайме (строки 243816-243833)
- ✅ Документация по интеграции в `POLZA_AI_INTEGRATION_GUIDE.md`

### Проблемы:
- ❌ Код все еще пытается подключаться к `api.kodacode.ru` вместо Polza
- ❌ Нет логики переключения между провайдерами
- ❌ Нет обработки Polza API endpoints
- ❌ SSL ошибки при подключении к kodacode.ru

## Требуемые изменения

### 1. Модификация build.js

Нужно обновить логику сборки в `build.js` (строки ~450-520):

```javascript
// Заменить существующую логику API роутинга
const isPolzaEnabled = !!(process.env.POLZA_API_KEY && process.env.POLZA_API_KEY.trim());

if (isPolzaEnabled) {
  // Заменить все упоминания api.kodacode.ru на api.polza.ai
  replaceInCode(/api\.kodacode\.ru/g, 'api.polza.ai');
  replaceInCode(/kodacode\.ru/g, 'polza.ai');
  
  // Добавить Polza-specific endpoints
  addPolzaEndpoints();
} else {
  // Оставить существующую логику для kodacode
  keepKodacodeEndpoints();
}
```

### 2. Создание Polza API Client

Добавить в `src/polza-client.js`:

```javascript
class PolzaAIClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.POLZA_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.polza.ai/api/v1';
    this.defaultModel = config.model || 'anthropic/claude-sonnet-4.5';
    // ... остальная конфигурация
  }

  async createChatCompletion(messages, options = {}) {
    const url = `${this.baseUrl}/chat/completions`;
    
    const requestBody = {
      model: options.model || this.defaultModel,
      messages: messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: options.stream ?? false
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Polza AI API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async listModels() {
    const url = `${this.baseUrl}/models`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    return response.json();
  }
}
```

### 3. Модификация основного кода k_da.js

Найти и заменить логику инициализации API клиента (строки ~194985-200620):

```javascript
// Заменить существующий код инициализации
const isPolzaEnabled = !!(process.env.POLZA_API_KEY && process.env.POLZA_API_KEY.trim());

let apiClient;
if (isPolzaEnabled) {
  // Использовать Polza AI
  const { PolzaAIClient } = await import('./polza-client.js');
  apiClient = new PolzaAIClient({
    apiKey: process.env.POLZA_API_KEY,
    model: process.env.POLZA_DEFAULT_MODEL || 'anthropic/claude-sonnet-4.5'
  });
  console.log('🤖 Using Polza AI provider');
} else {
  // Использовать существующий Kodacode клиент
  apiClient = new KodaClient({
    apiKey: process.env.KODA_API_KEY,
    authType: getAuthType()
  });
  console.log('🔧 Using Koda API provider');
}
```

### 4. Добавление CLI флагов

Добавить новые опции командной строки:

```javascript
.option('--polza', {
  type: 'boolean',
  description: 'Use Polza AI as the model provider'
})
.option('--polza-model <model>', {
  type: 'string',
  description: 'Polza AI model to use (e.g., anthropic/claude-sonnet-4.5)'
})
.option('--provider <provider>', {
  type: 'string',
  choices: ['polza', 'koda'],
  description: 'Choose AI provider (polza or koda)'
})
```

### 5. Обновление .env.example

Добавить новые переменные окружения:

```bash
# ==============================================================================
# Polza AI Configuration (alternative to Koda API)
# ==============================================================================

# POLZA_API_KEY - API key for Polza AI service
# Get from: https://polza.ai
POLZA_API_KEY=ak_your_api_key_here

# POLZA_DEFAULT_MODEL - Default model for Polza AI
POLZA_DEFAULT_MODEL=anthropic/claude-sonnet-4.5

# POLZA_API_BASE - Base URL for Polza AI API
POLZA_API_BASE=https://api.polza.ai/api/v1

# PROVIDER_SELECTION - Choose default provider
# Options: 'polza' or 'koda' (default: koda)
# PROVIDER_SELECTION=polza
```

## Архитектура решения

### Приоритет выбора провайдера:
1. **CLI флаг**: `--provider polza` или `--polza`
2. **Переменная окружения**: `PROVIDER_SELECTION=polza`
3. **Наличие POLZA_API_KEY**: Если установлен, использовать Polza
4. **По умолчанию**: Koda API

### Поддерживаемые модели через Polza:
- `anthropic/claude-sonnet-4.5` - Claude Sonnet 4.5
- `anthropic/claude-3-5-sonnet` - Claude 3.5 Sonnet  
- `openai/gpt-4o` - GPT-4 Optimized
- `openai/o1-preview` - O1 with reasoning
- `deepseek/deepseek-r1` - DeepSeek R1

## Проверочные тесты

После интеграции должны работать команды:

```bash
# Использовать Polza AI с Claude
POLZA_API_KEY=ak_your_key k_da.js --provider polza --polza-model anthropic/claude-sonnet-4.5

# Использовать Koda API (по умолчанию)
k_da.js --provider koda

# Автоматический выбор Polza при наличии POLZA_API_KEY
POLZA_API_KEY=ak_your_key k_da.js --polza-model anthropic/claude-3-5-sonnet
```

## Ожидаемый результат

После выполнения этих изменений:

1. ✅ Пользователи смогут выбирать между Polza AI и Kodacode
2. ✅ Полная поддержка Claude моделей через Polza
3. ✅ Простая настройка через переменные окружения
4. ✅ CLI флаги для интерактивного выбора
5. ✅ Обратная совместимость с существующим кодом

## Файлы для модификации

1. `build.js` - логика сборки с Polza интеграцией
2. `k_da.js` - основной код с провайдер selection
3. `src/polza-client.js` - новый файл с Polza клиентом
4. `.env.example` - обновление переменных окружения
5. `README.md` - документация по использованию

---

**Важно**: Убедиться, что все изменения сохраняют обратную совместимость с существующим кодом и не ломают текущую функциональность для пользователей, которые не используют Polza AI.