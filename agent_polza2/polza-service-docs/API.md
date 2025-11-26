# Polza AI API Reference

Полная документация по API сервиса Polza AI.

## 📋 Содержание

- [Базовые настройки](#-базовые-настройки)
- [Authentication](#-authentication)
- [Endpoints](#-endpoints)
- [Models](#-models)
- [Chat Completions](#-chat-completions)
- [Tool Calling](#-tool-calling)
- [Streaming](#-streaming)
- [Error Handling](#-error-handling)
- [Rate Limits](#-rate-limits)

## 🔧 Базовые настройки

### API Endpoint
```
https://api.polza.ai/api/v1
```

### Headers
```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Базовый URL для клиентов
```javascript
// OpenAI-compatible clients
baseURL: "https://api.polza.ai/api/v1"
```

## 🔐 Authentication

### API Key
Получите API ключ на [polza.ai](https://polza.ai)

```bash
# Использование в запросах
curl -H "Authorization: Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo" \
     https://api.polza.ai/api/v1/models
```

### Примеры клиентов

#### JavaScript (Fetch API)
```javascript
const response = await fetch('https://api.polza.ai/api/v1/models', {
  headers: {
    'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
    'Content-Type': 'application/json'
  }
});
```

#### Python (Requests)
```python
import requests

headers = {
    'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.polza.ai/api/v1/models', headers=headers)
```

## 📡 Endpoints

### GET /models

Получение списка доступных моделей.

#### Request
```http
GET /api/v1/models
Authorization: Bearer YOUR_API_KEY
```

#### Response
```json
{
  "object": "list",
  "data": [
    {
      "id": "anthropic/claude-sonnet-4.5",
      "object": "model",
      "created": 1677610602,
      "owned_by": "anthropic"
    }
  ]
}
```

#### Пример
```bash
curl -X GET "https://api.polza.ai/api/v1/models" \
  -H "Authorization: Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo" \
  -H "Content-Type: application/json"
```

### POST /chat/completions

Основной endpoint для создания чат-комплишенов.

#### Request Body
```json
{
  "model": "anthropic/claude-sonnet-4.5",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user", 
      "content": "Hello, how are you?"
    }
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "stream": false,
  "tools": []
}
```

#### Параметры

| Параметр | Тип | Описание | По умолчанию |
|----------|-----|----------|--------------|
| `model` | string | ID модели | **Обязателен** |
| `messages` | array | Сообщения чата | **Обязателен** |
| `max_tokens` | integer | Максимальное количество токенов | 8192 |
| `temperature` | number | Температура генерации (0-2) | 1.0 |
| `top_p` | number | nucleus sampling (0-1) | 1.0 |
| `stream` | boolean | Включить потоковый режим | false |
| `tools` | array | Список доступных инструментов | [] |
| `tool_choice` | string | Режим выбора инструментов | "auto" |
| `stop` | array | Стоп-последовательности | [] |

#### Response
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "anthropic/claude-sonnet-4.5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing great, thank you for asking. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 12,
    "total_tokens": 27
  }
}
```

#### Примеры запросов

##### Простой чат
```bash
curl -X POST "https://api.polza.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [
      {
        "role": "user",
        "content": "Explain quantum computing in simple terms"
      }
    ]
  }'
```

##### С системным сообщением
```bash
curl -X POST "https://api.polza.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful coding assistant that always explains things clearly."
      },
      {
        "role": "user",
        "content": "Write a Python function to calculate fibonacci numbers"
      }
    ]
  }'
```

## 🤖 Models

### Claude Sonnet 4.5

**ID**: `anthropic/claude-sonnet-4.5`

#### Характеристики
- **Контекст**: 200,000 токенов
- **Максимальный вывод**: 8,192 токена
- **Поддержка инструментов**: ✅
- **Поддержка изображений**: ✅
- **Режимы**: Text, Tool calling, Vision

#### Параметры модели
```json
{
  "id": "anthropic/claude-sonnet-4.5",
  "object": "model",
  "created": 1677610602,
  "owned_by": "anthropic",
  "capabilities": {
    "vision": true,
    "tools": true,
    "streaming": true
  },
  "limits": {
    "context": 200000,
    "max_tokens": 8192,
    "temperature_range": [0.0, 2.0]
  },
  "pricing": {
    "input_per_token": 0.000003,
    "output_per_token": 0.000015,
    "cache_read_per_token": 0.0000003,
    "cache_write_per_token": 0.00000375
  }
}
```

## 💬 Chat Completions

### Форматы сообщений

#### User Message
```json
{
  "role": "user",
  "content": "Hello, how can you help me?"
}
```

#### System Message
```json
{
  "role": "system",
  "content": "You are a helpful assistant that specializes in programming."
}
```

#### Assistant Message
```json
{
  "role": "assistant",
  "content": "I can help you with programming questions, code review, and debugging."
}
```

#### Tool Message
```json
{
  "role": "tool",
  "tool_call_id": "call_abc123",
  "content": "{\"result\": \"File content here\"}"
}
```

### Пример полного диалога

```json
{
  "model": "anthropic/claude-sonnet-4.5",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful coding assistant."
    },
    {
      "role": "user",
      "content": "Can you help me write a Python script to read a CSV file?"
    },
    {
      "role": "assistant",
      "tool_calls": [
        {
          "id": "call_1",
          "type": "function",
          "function": {
            "name": "read_csv",
            "arguments": "{\"file_path\": \"data.csv\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_1",
      "content": "{\"content\": \"name,age\\nJohn,30\\nJane,25\"}"
    },
    {
      "role": "assistant",
      "content": "I can see your CSV file contains name and age columns. Here's a Python script to read it:"
    }
  ],
  "max_tokens": 1000,
  "temperature": 0.3
}
```

## 🔧 Tool Calling

### Определение инструментов

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather information for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City name or coordinates"
            },
            "units": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"],
              "description": "Temperature units"
            }
          },
          "required": ["location"]
        }
      }
    },
    {
      "type": "function", 
      "function": {
        "name": "search_web",
        "description": "Search the web for information",
        "parameters": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Search query"
            },
            "limit": {
              "type": "integer",
              "description": "Number of results",
              "default": 5
            }
          },
          "required": ["query"]
        }
      }
    }
  ]
}
```

### Полный пример с инструментами

#### Запрос с инструментами
```bash
curl -X POST "https://api.polza.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [
      {
        "role": "user",
        "content": "What is the weather like in Moscow today?"
      }
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Get current weather for a location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "City name"
              },
              "units": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "default": "celsius"
              }
            },
            "required": ["location"]
          }
        }
      }
    ]
  }'
```

#### Ответ с tool_calls
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "anthropic/claude-sonnet-4.5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_weather_1",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\": \"Moscow\", \"units\": \"celsius\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 8,
    "total_tokens": 53
  }
}
```

#### Продолжение диалога с результатом инструмента
```bash
curl -X POST "https://api.polza.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [
      {
        "role": "user",
        "content": "What is the weather like in Moscow today?"
      },
      {
        "role": "assistant",
        "tool_calls": [
          {
            "id": "call_weather_1",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\": \"Moscow\", \"units\": \"celsius\"}"
            }
          }
        ]
      },
      {
        "role": "tool",
        "tool_call_id": "call_weather_1",
        "content": "{\"temperature\": 15, \"condition\": \"sunny\", \"humidity\": 65}"
      }
    ]
  }'
```

## 🌊 Streaming

### Включение потокового режима

```json
{
  "model": "anthropic/claude-sonnet-4.5",
  "messages": [
    {
      "role": "user",
      "content": "Write a short story about a robot learning to paint"
    }
  ],
  "stream": true
}
```

### Потоковый ответ

```
data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1677652288,"model":"anthropic/claude-sonnet-4.5","choices":[{"index":0,"delta":{"content":"In"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1677652288,"model":"anthropic/claude-sonnet-4.5","choices":[{"index":0,"delta":{"content":" a"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1677652288,"model":"anthropic/claude-sonnet-4.5","choices":[{"index":0,"delta":{"content":" workshop"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1677652288,"model":"anthropic/claude-sonnet-4.5","choices":[{"index":0,"delta":{"content":" where"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1677652288,"model":"anthropic/claude-sonnet-4.5","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### JavaScript обработка потоков

```javascript
async function streamChatCompletion() {
  const response = await fetch('https://api.polza.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [
        { role: 'user', content: 'Tell me a joke' }
      ],
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          console.log('Stream completed');
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) {
            process.stdout.write(content);
          }
        } catch (e) {
          console.error('Error parsing JSON:', e);
        }
      }
    }
  }
}

streamChatCompletion();
```

## ❌ Error Handling

### Стандартные коды ошибок

#### 401 Unauthorized
```json
{
  "error": {
    "message": "Incorrect API key provided.",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}
```

#### 404 Not Found
```json
{
  "error": {
    "message": "The model `anthropic/claude-sonnet-4.5` does not exist",
    "type": "invalid_request_error",
    "param": "model",
    "code": "model_not_found"
  }
}
```

#### 429 Rate Limit
```json
{
  "error": {
    "message": "Rate limit reached for requests",
    "type": "rate_limit_exceeded",
    "param": null,
    "code": "rate_limit_exceeded"
  }
}
```

#### 500 Server Error
```json
{
  "error": {
    "message": "Internal server error",
    "type": "server_error",
    "param": null,
    "code": "internal_error"
  }
}
```

### Обработка ошибок в коде

```javascript
async function safeChatCompletion(messages) {
  try {
    const response = await fetch('https://api.polza.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat completion failed:', error);
    throw error;
  }
}
```

## 🚦 Rate Limits

### Текущие лимиты
- **Запросов в минуту**: Зависит от тарифного плана
- **Токенов в минуту**: Зависит от тарифного плана
- **Максимальный контекст**: 200,000 токенов
- **Максимальный вывод**: 8,192 токена

### Обработка rate limits

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Использование
const result = await retryWithBackoff(() => 
  chatCompletion(messages)
);
```

## 📊 Usage и мониторинг

### Получение статистики использования

```javascript
function calculateCost(usage) {
  const inputCost = (usage.prompt_tokens / 1000000) * 3;
  const outputCost = (usage.completion_tokens / 1000000) * 15;
  return inputCost + outputCost;
}

async function trackUsage() {
  const result = await chatCompletion(messages);
  const cost = calculateCost(result.usage);
  
  console.log(`Использовано токенов: ${result.usage.total_tokens}`);
  console.log(`Стоимость: $${cost.toFixed(4)}`);
  
  return { usage: result.usage, cost };
}
```

### Логирование запросов

```javascript
function logRequest(messages, model, options = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    model,
    messageCount: messages.length,
    options: {
      max_tokens: options.max_tokens,
      temperature: options.temperature,
      stream: options.stream
    }
  };
  
  console.log('Polza Request:', JSON.stringify(logEntry, null, 2));
  return logEntry;
}
```

Эта документация покрывает все основные возможности API Polza AI. Для получения дополнительной информации обращайтесь к [OpenAI API Reference](https://platform.openai.com/docs/api-reference).