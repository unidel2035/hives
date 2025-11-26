# Polza AI - Решение проблем

Подробное руководство по диагностике и решению проблем при работе с Polza AI.

## 📋 Содержание

- [Диагностика подключения](#-диагностика-подключения)
- [Ошибки аутентификации](#-ошибки-аутентификации)
- [Проблемы с API](#-проблемы-с-api)
- [Ошибки инструментов](#-ошибки-инструментов)
- [Проблемы производительности](#-проблемы-производительности)
- [Rate Limits](#-rate-limits)
- [Ошибки инструментов (Tool Errors)](#-ошибки-инструментов-tool-errors)
- [Проблемы с потоковой передачей](#-проблемы-с-потоковой-передачей)
- [Отладка и логирование](#-отладка-и-логирование)
- [Часто задаваемые вопросы](#-часто-задаваемые-вопросы)

## 🔍 Диагностика подключения

### Проверка доступности API

```bash
# Проверка базового подключения
curl -X GET "https://api.polza.ai/api/v1/models" \
  -H "Authorization: Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo" \
  -H "Content-Type: application/json" \
  -v

# Ожидаемый ответ (200 OK):
# HTTP/1.1 200 OK
# {"object":"list","data":[...]}
```

### Проверка сетевого подключения

```bash
# Проверка DNS
nslookup api.polza.ai

# Проверка подключения
ping api.polza.ai

# Проверка порта
telnet api.polza.ai 443
```

### JavaScript диагностика

```javascript
async function diagnoseConnection() {
  console.log('🔍 Диагностика подключения к Polza AI...');
  
  try {
    // Проверка DNS
    const startTime = Date.now();
    const response = await fetch('https://api.polza.ai/api/v1/models', {
      headers: {
        'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
        'Content-Type': 'application/json'
      }
    });
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Подключение успешно: ${response.status} (${responseTime}ms)`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📋 Доступно моделей: ${data.data.length}`);
      console.log('📋 Доступные модели:', data.data.map(m => m.id));
    } else {
      console.error(`❌ Ошибка HTTP: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('📋 Детали ошибки:', errorText);
    }
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
    
    // Анализ типа ошибки
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🔧 Возможные решения:');
      console.error('  - Проверьте интернет-соединение');
      console.error('  - Проверьте файрвол/прокси');
      console.error('  - Убедитесь, что api.polza.ai доступен');
    } else if (error.message.includes('CORS')) {
      console.error('🔧 Возможные решения:');
      console.error('  - Используйте серверный прокси');
      console.error('  - Настройте CORS заголовки');
    }
  }
}

// Запуск диагностики
diagnoseConnection();
```

### Python диагностика

```python
import requests
import json
import time

def diagnose_connection():
    print("🔍 Диагностика подключения к Polza AI...")
    
    url = "https://api.polza.ai/api/v1/models"
    headers = {
        "Authorization": "Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo",
        "Content-Type": "application/json"
    }
    
    try:
        start_time = time.time()
        response = requests.get(url, headers=headers, timeout=10)
        response_time = int((time.time() - start_time) * 1000)
        
        print(f"✅ Подключение: HTTP {response.status_code} ({response_time}ms)")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📋 Доступно моделей: {len(data.get('data', []))}")
            print("📋 Модели:", [m.get('id') for m in data.get('data', [])])
        else:
            print(f"❌ Ошибка HTTP: {response.status_code}")
            print("📋 Ответ сервера:", response.text)
            
    except requests.exceptions.ConnectionError as e:
        print("❌ Ошибка соединения:", str(e))
        print("🔧 Проверьте интернет-соединение и доступность api.polza.ai")
        
    except requests.exceptions.Timeout as e:
        print("❌ Таймаут соединения:", str(e))
        print("🔧 Проверьте скорость интернета")
        
    except requests.exceptions.RequestException as e:
        print("❌ Ошибка запроса:", str(e))

if __name__ == "__main__":
    diagnose_connection()
```

## 🔐 Ошибки аутентификации

### Ошибка 401 - Invalid API Key

**Симптомы:**
```
{
  "error": {
    "message": "Incorrect API key provided.",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

**Причины:**
- Неверный API ключ
- Ключ истек
- Ключ заблокирован
- Неправильный формат заголовка

**Решения:**

1. **Проверьте API ключ:**
```bash
# Убедитесь, что ключ правильный
echo $POLZA_API_KEY
# или
cat ~/.polza/config.json
```

2. **Проверьте формат заголовка:**
```javascript
// ❌ Неправильно
headers: {
  'API-Key': 'ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo'
}

// ✅ Правильно
headers: {
  'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo'
}
```

3. **Проверьте переменные окружения:**
```bash
# Правильная установка
export POLZA_API_KEY="ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo"

# Проверка в JavaScript
console.log('API Key:', process.env.POLZA_API_KEY ? '✅ Set' : '❌ Missing');

// Проверка в Python
import os
print('API Key:', '✅ Set' if os.getenv('POLZA_API_KEY') else '❌ Missing')
```

### Ошибка 403 - Forbidden

**Симптомы:**
```
{
  "error": {
    "message": "Your account does not have access to this resource.",
    "type": "permission_denied",
    "code": "insufficient_permissions"
  }
}
```

**Причины:**
- Недостаточно прав для модели
- Аккаунт заблокирован
- Превышены лимиты

**Решения:**
1. Проверьте статус аккаунта
2. Убедитесь, что модель доступна для вашего тарифа
3. Обратитесь в поддержку

## 🚀 Проблемы с API

### Ошибка 404 - Model Not Found

**Симптомы:**
```
{
  "error": {
    "message": "The model `anthropic/claude-sonnet-4.5` does not exist",
    "type": "invalid_request_error",
    "param": "model",
    "code": "model_not_found"
  }
}
```

**Причины:**
- Неправильное имя модели
- Модель недоступна
- Опечатка в названии

**Решения:**

1. **Получите список доступных моделей:**
```bash
curl -X GET "https://api.polza.ai/api/v1/models" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```javascript
async function getAvailableModels() {
  try {
    const response = await fetch('https://api.polza.ai/api/v1/models', {
      headers: {
        'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo'
      }
    });
    
    const data = await response.json();
    console.log('Доступные модели:', data.data.map(m => m.id));
    
    return data.data.map(m => m.id);
  } catch (error) {
    console.error('Ошибка получения моделей:', error);
    return [];
  }
}

// Использование
const models = await getAvailableModels();
const validModel = models.includes('anthropic/claude-sonnet-4.5') 
  ? 'anthropic/claude-sonnet-4.5' 
  : models[0];
```

2. **Проверьте правильные названия моделей:**
```javascript
const VALID_MODELS = [
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-haiku-4.5',
  'anthropic/claude-opus-4.1'
];

function validateModel(modelId) {
  if (!VALID_MODELS.includes(modelId)) {
    throw new Error(`Модель ${modelId} недоступна. Доступные: ${VALID_MODELS.join(', ')}`);
  }
  return modelId;
}
```

### Ошибка 422 - Invalid Request

**Симптомы:**
```
{
  "error": {
    "message": "Invalid request format",
    "type": "invalid_request_error",
    "param": "messages"
  }
}
```

**Причины:**
- Неправильный формат сообщений
- Отсутствуют обязательные поля
- Неверная структура JSON

**Решения:**

1. **Валидация формата сообщений:**
```javascript
function validateMessages(messages) {
  if (!Array.isArray(messages)) {
    throw new Error('messages должен быть массивом');
  }
  
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    
    if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
      throw new Error(`Сообщение ${i}: неверный role. Должен быть system, user или assistant`);
    }
    
    if (!message.content) {
      throw new Error(`Сообщение ${i}: отсутствует content`);
    }
    
    if (typeof message.content !== 'string') {
      throw new Error(`Сообщение ${i}: content должен быть строкой`);
    }
  }
  
  return true;
}

// Использование
try {
  validateMessages(messages);
  // Продолжаем с запросом
} catch (error) {
  console.error('Валидация не пройдена:', error.message);
}
```

2. **Правильная структура запроса:**
```javascript
const requestBody = {
  model: 'anthropic/claude-sonnet-4.5',
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant.'
    },
    {
      role: 'user',
      content: 'Hello!'
    }
  ],
  max_tokens: 1000,
  temperature: 0.7
};

// Валидация перед отправкой
if (!requestBody.model || !requestBody.messages) {
  throw new Error('model и messages обязательны');
}

const response = await fetch('https://api.polza.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});
```

## ⚙️ Ошибки инструментов

### Tool Call Errors

**Симптомы:**
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": null,
      "tool_calls": [{
        "id": "call_123",
        "function": {
          "name": "nonexistent_tool",
          "arguments": "{}"
        }
      }]
    }
  }]
}
```

**Причины:**
- Незарегистрированный инструмент
- Неправильные параметры
- Ошибка выполнения инструмента

**Решения:**

1. **Проверка зарегистрированных инструментов:**
```javascript
class ToolManager {
  constructor() {
    this.tools = new Map();
  }
  
  registerTool(name, tool) {
    this.tools.set(name, tool);
  }
  
  getTool(name) {
    return this.tools.get(name);
  }
  
  listTools() {
    return Array.from(this.tools.keys());
  }
  
  async executeTool(name, args) {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Инструмент ${name} не найден. Доступные: ${this.listTools().join(', ')}`);
    }
    
    try {
      return await tool.execute(args);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tool: name,
        args
      };
    }
  }
}

// Использование
const toolManager = new ToolManager();

// Регистрация инструментов
toolManager.registerTool('get_weather', {
  execute: async ({ location }) => {
    // Реализация получения погоды
    return { temperature: 20, condition: 'sunny' };
  }
});

// Проверка перед выполнением
async function handleToolCall(toolCall) {
  const { name, arguments: args } = toolCall.function;
  
  if (!toolManager.getTool(name)) {
    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      content: JSON.stringify({
        error: `Инструмент ${name} не доступен`,
        available_tools: toolManager.listTools()
      })
    };
  }
  
  try {
    const parsedArgs = JSON.parse(args);
    const result = await toolManager.executeTool(name, parsedArgs);
    
    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      content: JSON.stringify(result)
    };
  } catch (error) {
    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      content: JSON.stringify({
        error: error.message,
        tool: name
      })
    };
  }
}
```

2. **Валидация параметров инструментов:**
```javascript
function validateToolParameters(toolName, args, schema) {
  // Простая валидация на основе схемы
  if (schema.required) {
    for (const requiredField of schema.required) {
      if (!(requiredField in args)) {
        throw new Error(`Обязательный параметр ${requiredField} отсутствует для ${toolName}`);
      }
    }
  }
  
  // Проверка типов
  if (schema.properties) {
    for (const [field, fieldSchema] of Object.entries(schema.properties)) {
      if (field in args) {
        const value = args[field];
        const expectedType = fieldSchema.type;
        
        if (expectedType && typeof value !== expectedType) {
          throw new Error(`Параметр ${field} должен быть типа ${expectedType}, получен ${typeof value}`);
        }
      }
    }
  }
  
  return true;
}

// Схема для инструмента погоды
const weatherToolSchema = {
  type: "object",
  properties: {
    location: {
      type: "string",
      description: "Название города"
    },
    units: {
      type: "string",
      enum: ["celsius", "fahrenheit"],
      default: "celsius"
    }
  },
  required: ["location"]
};

// Использование
try {
  validateToolParameters('get_weather', { location: 'Moscow' }, weatherToolSchema);
  // Продолжаем выполнение
} catch (error) {
  console.error('Ошибка валидации:', error.message);
}
```

## 📊 Проблемы производительности

### Медленные ответы

**Диагностика:**
```javascript
async function measurePerformance() {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.polza.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: 'Привет!' }]
      })
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ Время ответа: ${duration}ms`);
    
    if (duration > 10000) {
      console.warn('⚠️ Медленный ответ (>10s)');
    }
    
    const data = await response.json();
    
    // Анализ использования токенов
    if (data.usage) {
      console.log('📊 Токены:', data.usage);
      
      const tokensPerSecond = data.usage.total_tokens / (duration / 1000);
      console.log(`🚀 Скорость: ${tokensPerSecond.toFixed(2)} токенов/сек`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    throw error;
  }
}
```

**Оптимизация:**

1. **Оптимизация промптов:**
```javascript
// ❌ Слишком длинный промпт
const longPrompt = `
Вы - очень умный помощник. Пожалуйста, ответьте на следующий вопрос максимально подробно.
Включите все возможные детали, примеры и объяснения. Используйте множество слов.
Вот мой вопрос: ${userQuestion}
`;

// ✅ Оптимизированный промпт
const optimizedPrompt = `
Ответь на вопрос: ${userQuestion}
`;

console.log(`Размер промпта: ${longPrompt.length} → ${optimizedPrompt.length} символов`);
```

2. **Использование контекстного окна:**
```javascript
function optimizeContext(messages, maxTokens = 8000) {
  let totalTokens = 0;
  const optimized = [];
  
  // Сортируем сообщения по важности
  const sortedMessages = messages.sort((a, b) => {
    // System сообщения всегда важны
    if (a.role === 'system') return -1;
    if (b.role === 'system') return 1;
    
    // Последние сообщения важнее
    return messages.indexOf(b) - messages.indexOf(a);
  });
  
  for (const message of sortedMessages) {
    const messageTokens = estimateTokens(message.content);
    
    if (totalTokens + messageTokens <= maxTokens) {
      optimized.unshift(message); // Добавляем в начало
      totalTokens += messageTokens;
    } else {
      break; // Достигли лимита
    }
  }
  
  return optimized;
}

function estimateTokens(text) {
  // Приблизительная оценка: 1 токен ≈ 4 символа
  return Math.ceil(text.length / 4);
}
```

3. **Кэширование ответов:**
```javascript
class ResponseCache {
  constructor(ttl = 300000) { // 5 минут
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    return null;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  generateKey(messages, options) {
    return JSON.stringify({ messages, options });
  }
  
  async getOrCompute(key, computeFn) {
    const cached = this.get(key);
    if (cached) {
      console.log('📋 Ответ взят из кэша');
      return cached;
    }
    
    console.log('🔄 Вычисляем ответ...');
    const data = await computeFn();
    this.set(key, data);
    return data;
  }
}

// Использование
const cache = new ResponseCache();

async function cachedChat(messages, options = {}) {
  const key = cache.generateKey(messages, options);
  
  return await cache.getOrCompute(key, async () => {
    return await client.chat(messages, options);
  });
}
```

## 🚦 Rate Limits

### Превышение лимитов

**Симптомы:**
```json
{
  "error": {
    "message": "Rate limit reached for requests",
    "type": "rate_limit_exceeded",
    "code": "rate_limit_exceeded"
  }
}
```

**Мониторинг лимитов:**
```javascript
class RateLimitMonitor {
  constructor() {
    this.requestTimes = [];
    this.tokenUsage = [];
  }
  
  recordRequest() {
    this.requestTimes.push(Date.now());
    // Очищаем старые записи (старше 1 минуты)
    const oneMinuteAgo = Date.now() - 60000;
    this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);
  }
  
  recordTokenUsage(tokens) {
    this.tokenUsage.push({
      tokens,
      timestamp: Date.now()
    });
    
    // Очищаем старые записи
    const oneMinuteAgo = Date.now() - 60000;
    this.tokenUsage = this.tokenUsage.filter(entry => entry.timestamp > oneMinuteAgo);
  }
  
  getCurrentRate() {
    return this.requestTimes.length;
  }
  
  getCurrentTokenUsage() {
    return this.tokenUsage.reduce((sum, entry) => sum + entry.tokens, 0);
  }
  
  canMakeRequest(maxRequestsPerMinute = 60, maxTokensPerMinute = 100000) {
    const requests = this.getCurrentRate();
    const tokens = this.getCurrentTokenUsage();
    
    return {
      requests: {
        current: requests,
        limit: maxRequestsPerMinute,
        canProceed: requests < maxRequestsPerMinute
      },
      tokens: {
        current: tokens,
        limit: maxTokensPerMinute,
        canProceed: tokens < maxTokensPerMinute
      }
    };
  }
}

// Использование
const monitor = new RateLimitMonitor();

async function makeRequestWithMonitoring(messages, options = {}) {
  // Проверяем лимиты
  const limits = monitor.canMakeRequest();
  
  if (!limits.requests.canProceed) {
    const waitTime = 60000 - (Date.now() - monitor.requestTimes[0]);
    throw new Error(`Превышен лимит запросов. Подождите ${Math.ceil(waitTime / 1000)} секунд`);
  }
  
  if (!limits.tokens.canProceed) {
    throw new Error(`Превышен лимит токенов. Подождите минуту`);
  }
  
  // Делаем запрос
  monitor.recordRequest();
  
  try {
    const response = await client.chat(messages, options);
    
    // Записываем использование токенов
    if (response.usage) {
      monitor.recordTokenUsage(response.usage.total_tokens);
    }
    
    return response;
  } catch (error) {
    if (error.status === 429) {
      console.error('⚠️ Rate limit exceeded');
    }
    throw error;
  }
}
```

### Автоматические повторы с экспоненциальной задержкой

```javascript
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Если это последняя попытка
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Если это не rate limit, не повторяем
      if (error.status !== 429) {
        throw error;
      }
      
      // Вычисляем задержку (экспоненциальная)
      const delay = baseDelay * Math.pow(2, attempt);
      
      console.log(`⚠️ Rate limit. Повтор через ${delay}ms (попытка ${attempt + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Использование
const response = await retryWithBackoff(() => 
  client.chat(messages, options)
);
```

## 🐛 Ошибки инструментов (Tool Errors)

### Обработка ошибок в инструментах

```javascript
class ToolErrorHandler {
  static handleToolError(error, toolName, args) {
    console.error(`❌ Ошибка в инструменте ${toolName}:`, error.message);
    
    // Классификация ошибок
    if (error.code === 'NETWORK_ERROR') {
      return {
        success: false,
        error: `Сетевая ошибка при выполнении ${toolName}`,
        retryable: true,
        details: {
          tool: toolName,
          args,
          originalError: error.message
        }
      };
    }
    
    if (error.code === 'INVALID_INPUT') {
      return {
        success: false,
        error: `Неверные входные данные для ${toolName}`,
        retryable: false,
        details: {
          tool: toolName,
          args,
          validationErrors: error.validationErrors
        }
      };
    }
    
    if (error.code === 'TIMEOUT') {
      return {
        success: false,
        error: `Таймаут выполнения ${toolName}`,
        retryable: true,
        details: {
          tool: toolName,
          args,
          timeout: error.timeout
        }
      };
    }
    
    // Общая ошибка
    return {
      success: false,
      error: `Неожиданная ошибка в ${toolName}: ${error.message}`,
      retryable: false,
      details: {
        tool: toolName,
        args,
        stack: error.stack
      }
    };
  }
  
  static async executeToolWithErrorHandling(tool, args) {
    try {
      return await tool.execute(args);
    } catch (error) {
      return ToolErrorHandler.handleToolError(error, tool.name, args);
    }
  }
}

// Использование
async function executeToolSafely(toolName, args) {
  const tool = toolManager.getTool(toolName);
  if (!tool) {
    return {
      success: false,
      error: `Инструмент ${toolName} не найден`,
      retryable: false
    };
  }
  
  return await ToolErrorHandler.executeToolWithErrorHandling(tool, args);
}
```

## 🌊 Проблемы с потоковой передачей

### Обработка прерываний потока

```javascript
class StreamHandler {
  constructor() {
    this.abortController = null;
  }
  
  async streamChat(messages, options = {}) {
    this.abortController = new AbortController();
    
    try {
      const response = await fetch('https://api.polza.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...options,
          model: 'anthropic/claude-sonnet-4.5',
          messages,
          stream: true
        }),
        signal: this.abortController.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Сохраняем последнюю неполную строку
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return { content: fullResponse, completed: true };
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              
              if (content) {
                fullResponse += content;
                console.log(content); // Или обновление UI
              }
            } catch (parseError) {
              console.warn('Ошибка парсинга JSON:', parseError.message);
            }
          }
        }
      }
      
      return { content: fullResponse, completed: true };
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Поток прерван пользователем');
        return { content: fullResponse, completed: false, aborted: true };
      }
      
      console.error('Ошибка потоковой передачи:', error);
      return { content: fullResponse, completed: false, error: error.message };
    } finally {
      this.abortController = null;
    }
  }
  
  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

// Использование
const streamHandler = new StreamHandler();

// Начало потоковой передачи
const result = await streamHandler.streamChat(messages);

// Прерывание (например, по кнопке "Отмена")
// streamHandler.abort();
```

### Обработка ошибок в потоковом режиме

```javascript
class RobustStreamHandler extends StreamHandler {
  async streamWithRetry(messages, options = {}, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.streamChat(messages, options);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Ошибки сети можно повторять
        if (this.isRetryableError(error)) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⚠️ Попытка ${attempt + 1} неудачна. Повтор через ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Неповторяемые ошибки
        throw error;
      }
    }
  }
  
  isRetryableError(error) {
    // Повторяемые ошибки: сеть, таймаут, 5xx
    return (
      error.name === 'TypeError' || // Network error
      error.message.includes('timeout') ||
      (error.status >= 500 && error.status < 600)
    );
  }
}
```

## 🔍 Отладка и логирование

### Система логирования

```javascript
class PolzaLogger {
  constructor(enableDebug = false) {
    this.enableDebug = enableDebug;
    this.logs = [];
  }
  
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    this.logs.push(logEntry);
    
    // Вывод в консоль
    const consoleMethod = {
      'error': 'error',
      'warn': 'warn',
      'info': 'info',
      'debug': 'debug'
    }[level] || 'log';
    
    console[consoleMethod](`[${timestamp}] ${message}`, data || '');
  }
  
  error(message, data) { this.log('error', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  info(message, data) { this.log('info', message, data); }
  debug(message, data) { 
    if (this.enableDebug) {
      this.log('debug', message, data);
    }
  }
  
  // Логирование API запросов
  logRequest(messages, options) {
    this.debug('API Request', {
      model: options.model || 'anthropic/claude-sonnet-4.5',
      messageCount: messages.length,
      totalChars: messages.reduce((sum, msg) => sum + msg.content.length, 0),
      options: {
        maxTokens: options.max_tokens,
        temperature: options.temperature,
        tools: options.tools ? options.tools.length : 0
      }
    });
  }
  
  // Логирование ответов
  logResponse(response, duration) {
    this.info('API Response', {
      duration: `${duration}ms`,
      tokens: response.usage ? {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
        total: response.usage.total_tokens
      } : null,
      finishReason: response.choices[0]?.finish_reason,
      hasToolCalls: !!response.choices[0]?.message?.tool_calls
    });
  }
  
  // Логирование ошибок
  logError(error, context) {
    this.error('API Error', {
      message: error.message,
      status: error.status,
      type: error.type,
      context,
      stack: error.stack
    });
  }
  
  // Получение логов
  getLogs(filter = {}) {
    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.since && new Date(log.timestamp) < new Date(filter.since)) return false;
      return true;
    });
  }
  
  // Экспорт логов
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Использование
const logger = new PolzaLogger(process.env.DEBUG === 'true');

class LoggingPolzaClient {
  constructor(apiKey) {
    this.client = new PolzaClient(apiKey);
    this.logger = logger;
  }
  
  async chat(messages, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.logRequest(messages, options);
      
      const response = await this.client.chat(messages, options);
      
      const duration = Date.now() - startTime;
      this.logger.logResponse(response, duration);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError(error, { duration, messages, options });
      throw error;
    }
  }
}
```

### Отладка инструментов

```javascript
class ToolDebugger {
  constructor(logger) {
    this.logger = logger;
  }
  
  async debugToolExecution(toolName, args, toolFunction) {
    this.logger.debug(`🔧 Выполнение инструмента: ${toolName}`, { args });
    
    const startTime = Date.now();
    
    try {
      // Валидация входных данных
      this.logger.debug(`✅ Валидация входных данных для ${toolName}`);
      
      // Выполнение инструмента
      const result = await toolFunction(args);
      
      const duration = Date.now() - startTime;
      this.logger.debug(`✅ Инструмент ${toolName} выполнен успешно`, {
        duration: `${duration}ms`,
        resultSize: JSON.stringify(result).length
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ Ошибка в инструменте ${toolName}`, {
        duration: `${duration}ms`,
        error: error.message,
        args
      });
      throw error;
    }
  }
}

// Использование
const debugger = new ToolDebugger(logger);

async function executeToolWithDebug(toolName, args, toolFunction) {
  return await debugger.debugToolExecution(toolName, args, toolFunction);
}
```

## ❓ Часто задаваемые вопросы

### Q: Почему API возвращает ошибку 429?

**A:** Превышены лимиты запросов или токенов. Решения:
- Используйте exponential backoff для повторов
- Реализуйте очередь запросов
- Оптимизируйте количество запросов
- Рассмотрите апгрейд тарифного плана

### Q: Как обрабатывать большие контексты?

**A:** 
```javascript
function splitLargeContext(messages, maxTokens = 180000) {
  let currentTokens = 0;
  const chunks = [];
  let currentChunk = [];
  
  for (const message of messages) {
    const messageTokens = estimateTokens(message.content);
    
    if (currentTokens + messageTokens > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [message];
      currentTokens = messageTokens;
    } else {
      currentChunk.push(message);
      currentTokens += messageTokens;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}
```

### Q: Как оптимизировать стоимость?

**A:**
```javascript
class CostOptimizer {
  static calculateCost(usage, model = 'anthropic/claude-sonnet-4.5') {
    const pricing = {
      'anthropic/claude-sonnet-4.5': {
        input: 0.000003,  // $3 за 1M токенов
        output: 0.000015  // $15 за 1M токенов
      }
    };
    
    const rates = pricing[model] || pricing['anthropic/claude-sonnet-4.5'];
    
    return {
      inputCost: (usage.prompt_tokens / 1000000) * rates.input,
      outputCost: (usage.completion_tokens / 1000000) * rates.output,
      totalCost: ((usage.prompt_tokens / 1000000) * rates.input) + 
                 ((usage.completion_tokens / 1000000) * rates.output)
    };
  }
  
  static optimizePrompt(originalPrompt) {
    // Удаляем лишние пробелы
    const optimized = originalPrompt.replace(/\s+/g, ' ').trim();
    
    // Считаем экономию
    const originalTokens = estimateTokens(originalPrompt);
    const optimizedTokens = estimateTokens(optimized);
    const savedTokens = originalTokens - optimizedTokens;
    
    return {
      original: originalPrompt,
      optimized,
      savedTokens,
      costSaving: (savedTokens / 1000000) * 0.000003 // $3 за 1M токенов
    };
  }
}
```

### Q: Как обрабатывать прерывания потоковой передачи?

**A:** Используйте AbortController для прерывания fetch запросов.

### Q: Почему инструменты не работают?

**A:** Проверьте:
1. Правильность регистрации инструментов
2. Соответствие схемам параметров
3. Обработку ошибок в инструментах
4. Правильность продолжения диалога с результатами

Это руководство поможет диагностировать и решить большинство проблем при работе с Polza AI.