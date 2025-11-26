# Polza API для разработчиков

Этот документ описывает API и архитектуру для разработчиков, которые хотят интегрировать или расширить функциональность Polza в @deep-assistant/agent.

## Содержание

- [Архитектура системы](#архитектура-системы)
- [Provider API](#provider-api)
- [Tool API](#tool-api)
- [Session API](#session-api)
- [Расширение функциональности](#расширение-функциональности)
- [Создание кастомных инструментов](#создание-кастомных-инструментов)
- [Интеграция новых провайдеров](#интеграция-новых-провайдеров)
- [Event System](#event-system)
- [Лучшие практики](#лучшие-практики)

## Архитектура системы

### Основные компоненты

```
┌─────────────────────────────────────────────────────────────┐
│                        Main Entry                           │
│                      (src/index.js)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Config        │  │    Server       │  │   Instance   │ │
│  │   Manager       │  │   (HTTP API)    │  │   Manager    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Provider      │  │  Tool Registry  │  │   Session    │ │
│  │   Manager       │  │   & Execution   │  │   Manager    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Polza SDK     │  │   OpenCode SDK  │  │   Другие     │ │
│  │  (OpenAI API)   │  │   (Zen API)     │  │   SDKs       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Поток выполнения

1. **Входная точка** (`src/index.js`) - парсит аргументы и читает stdin
2. **Server** - запускает HTTP сервер для обработки сессий
3. **Instance Manager** - управляет жизненным циклом приложения
4. **Provider Manager** - загружает и конфигурирует AI провайдеры
5. **Tool Registry** - регистрирует и выполняет инструменты
6. **Session Manager** - управляет сессиями и сообщениями

## Provider API

### Структура Provider

```typescript
interface Provider {
  id: string                    // Уникальный идентификатор провайдера
  npm?: string                  // NPM пакет для SDK
  name: string                  // Отображаемое имя
  env: string[]                 // Переменные окружения для API ключей
  api?: string                  // Базовый URL API
  models: Record<string, Model> // Доступные модели
}

interface Model {
  id: string                    // ID модели в провайдере
  name: string                  // Отображаемое имя
  cost: {
    input: number              // Стоимость за 1M входных токенов
    output: number             // Стоимость за 1M выходных токенов
    cache_read?: number        // Стоимость чтения из кэша
    cache_write?: number       // Стоимость записи в кэш
  }
  limit: {
    context: number            // Максимальный контекст
    output: number             // Максимальный вывод
  }
  modalities: {
    input: string[]            // Поддерживаемые модальности ввода
    output: string[]           // Поддерживаемые модальности вывода
  }
}
```

### Регистрация провайдера

#### Через конфигурационный файл

```json
{
  "provider": {
    "my-provider": {
      "npm": "@ai-sdk/my-provider",
      "api": "https://api.my-provider.com/v1",
      "name": "My Provider",
      "env": ["MY_PROVIDER_API_KEY"],
      "models": {
        "my-model": {
          "id": "my-model-id",
          "name": "My Model",
          "cost": { "input": 1, "output": 2 },
          "limit": { "context": 32000, "output": 4000 },
          "modalities": { "input": ["text"], "output": ["text"] }
        }
      }
    }
  }
}
```

#### Через CUSTOM_LOADERS

```typescript
const CUSTOM_LOADERS: Record<string, CustomLoader> = {
  "my-provider": async (input) => {
    const hasKey = process.env["MY_PROVIDER_API_KEY"]
    if (!hasKey) {
      return { autoload: false }
    }

    return {
      autoload: true,
      async getModel(sdk: any, modelID: string, options?: Record<string, any>) {
        // Кастомная логика получения модели
        return sdk.languageModel(modelID)
      },
      options: {
        apiKey: hasKey,
        baseURL: "https://api.my-provider.com/v1"
      }
    }
  }
}
```

### Использование провайдера

```typescript
import { Provider } from './provider/provider.ts'

// Получение модели
const model = await Provider.getModel('my-provider', 'my-model')

// Создание ответа
const response = await model.language.generate({
  messages: [
    { role: 'user', content: 'Hello' }
  ]
})
```

## Tool API

### Структура Tool

```typescript
interface Tool<Parameters extends z.ZodType = z.ZodType, M extends Metadata = Metadata> {
  id: string
  init: () => Promise<{
    description: string
    parameters: Parameters
    execute(
      args: z.infer<Parameters>,
      ctx: Context,
    ): Promise<{
      title: string
      metadata: M
      output: string
      attachments?: MessageV2.FilePart[]
    }>
    formatValidationError?(error: z.ZodError): string
  }>
}

interface Context {
  sessionID: string
  messageID: string
  agent: string
  abort: AbortSignal
  callID?: string
  extra?: { [key: string]: any }
  metadata(input: { title?: string; metadata?: M }): void
}
```

### Создание инструмента

```typescript
import { Tool } from './tool/tool.ts'
import z from 'zod'
import DESCRIPTION from './mytool.txt'

export const MyTool = Tool.define('mytool', {
  description: DESCRIPTION,
  parameters: z.object({
    param1: z.string().describe('Первый параметр'),
    param2: z.number().describe('Второй параметр').optional(),
    options: z.object({
      verbose: z.boolean().describe('Подробный вывод').optional()
    }).optional()
  }),
  async execute(params, ctx) {
    // Валидация параметров происходит автоматически
    const { param1, param2 = 0, options = {} } = params

    // Обновление метаданных
    ctx.metadata({
      metadata: {
        status: 'processing',
        progress: 0
      }
    })

    try {
      // Выполнение основной логики
      const result = await myToolLogic(param1, param2, options)

      ctx.metadata({
        metadata: {
          status: 'completed',
          result
        }
      })

      return {
        title: `MyTool: ${param1}`,
        output: result.output,
        metadata: {
          status: 'completed',
          result,
          timestamp: Date.now()
        }
      }
    } catch (error) {
      ctx.metadata({
        metadata: {
          status: 'error',
          error: error.message
        }
      })

      throw new Error(`MyTool failed: ${error.message}`)
    }
  },
  formatValidationError(error) {
    const formattedErrors = error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
        return `  - ${path}: ${issue.message}`
      })
      .join('\n')

    return `Invalid parameters for tool 'mytool':\n${formattedErrors}`
  }
})
```

### Регистрация инструмента

```typescript
import { ToolRegistry } from './tool/registry.ts'

// Автоматическая регистрация при импорте
ToolRegistry.register(MyTool)
```

## Session API

### Создание сессии

```typescript
import { Session } from './session/index.ts'

const session = await Session.create({
  model: {
    providerID: 'polza',
    modelID: 'claude-sonnet-4.5'
  },
  system: 'You are a helpful assistant.',
  appendSystem: undefined
})
```

### Отправка сообщения

```typescript
const message = await Session.message(session.id, {
  parts: [
    {
      type: 'text',
      text: 'Hello, world!'
    }
  ],
  model: {
    providerID: 'polza',
    modelID: 'claude-sonnet-4.5'
  }
})
```

### Обновление части сессии

```typescript
import { Session } from './session/index.ts'
import { Identifier } from './id/id.ts'

const partID = Identifier.ascending('part')

await Session.updatePart({
  id: partID,
  messageID: 'msg_123',
  sessionID: 'ses_456',
  type: 'tool',
  tool: 'bash',
  callID: partID,
  state: {
    status: 'running',
    input: { command: 'ls -la' },
    time: {
      start: Date.now()
    }
  }
})
```

## Расширение функциональности

### Кастомные команды CLI

```typescript
// src/cli/cmd/custom.ts
import { Cmd } from './cmd.ts'

export const CustomCmd = Cmd.define({
  name: 'custom',
  description: 'Custom command description',
  parameters: z.object({
    flag: z.boolean().describe('Some flag').optional(),
    input: z.string().describe('Input file')
  }),
  async run(args, _opts) {
    console.log('Custom command:', args)
    return { success: true }
  }
})
```

### Кастомные утилиты

```typescript
// src/util/custom.ts
export class CustomUtil {
  static async processData(data: any) {
    // Кастомная логика обработки
    return processedData
  }

  static formatOutput(result: any) {
    // Форматирование результата
    return JSON.stringify(result, null, 2)
  }
}
```

### Кастомные провайдеры

```typescript
// src/provider/custom.ts
import { Provider } from './provider.ts'

export class CustomProvider {
  static async initialize() {
    // Инициализация провайдера
    return {
      id: 'custom',
      models: {
        'custom-model': {
          id: 'custom-model-id',
          name: 'Custom Model',
          // ... остальные поля
        }
      }
    }
  }

  static async generateResponse(model: string, messages: any[]) {
    // Логика генерации ответа
    const response = await customAPI.generate(model, messages)
    return response
  }
}
```

## Создание кастомных инструментов

### Пример: Database Tool

```typescript
// src/tool/database.ts
import z from 'zod'
import { Tool } from './tool/tool.ts'

export const DatabaseTool = Tool.define('database', {
  description: 'Execute database queries',
  parameters: z.object({
    query: z.string().describe('SQL query to execute'),
    connection: z.string().describe('Database connection string').optional(),
    timeout: z.number().describe('Query timeout in milliseconds').optional()
  }),
  async execute(params, ctx) {
    const { query, connection, timeout = 30000 } = params

    ctx.metadata({
      metadata: {
        query,
        status: 'executing'
      }
    })

    try {
      // Подключение к базе данных
      const db = await connectToDatabase(connection)

      // Выполнение запроса с таймаутом
      const result = await Promise.race([
        db.query(query),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ])

      ctx.metadata({
        metadata: {
          status: 'completed',
          rowCount: result.rowCount,
          executionTime: Date.now() - startTime
        }
      })

      return {
        title: `Database Query`,
        output: `Executed query successfully. Rows affected: ${result.rowCount}`,
        metadata: {
          status: 'completed',
          rowCount: result.rowCount,
          result: result.rows
        }
      }
    } catch (error) {
      ctx.metadata({
        metadata: {
          status: 'error',
          error: error.message
        }
      })

      throw new Error(`Database query failed: ${error.message}`)
    }
  }
})
```

### Пример: API Tool

```typescript
// src/tool/api.ts
import z from 'zod'
import { Tool } from './tool/tool.ts'

export const ApiTool = Tool.define('api', {
  description: 'Make HTTP API requests',
  parameters: z.object({
    url: z.string().url().describe('API endpoint URL'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
    headers: z.record(z.string()).describe('Request headers').optional(),
    body: z.any().describe('Request body').optional(),
    timeout: z.number().describe('Request timeout').optional()
  }),
  async execute(params, ctx) {
    const { url, method, headers, body, timeout = 30000 } = params

    ctx.metadata({
      metadata: {
        url,
        method,
        status: 'requesting'
      }
    })

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const responseData = await response.json()

      ctx.metadata({
        metadata: {
          status: 'completed',
          statusCode: response.status,
          contentType: response.headers.get('content-type')
        }
      })

      return {
        title: `API ${method} ${url}`,
        output: `Request completed with status ${response.status}`,
        metadata: {
          status: 'completed',
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData
        }
      }
    } catch (error) {
      ctx.metadata({
        metadata: {
          status: 'error',
          error: error.message
        }
      })

      throw new Error(`API request failed: ${error.message}`)
    }
  }
})
```

## Интеграция новых провайдеров

### Структура интеграции

```typescript
// 1. Определите тип провайдера
interface MyProviderConfig {
  apiKey: string
  baseURL?: string
  timeout?: number
}

// 2. Создайте кастомный загрузчик
const CUSTOM_LOADERS: Record<string, CustomLoader> = {
  "my-provider": async (input) => {
    const hasKey = process.env["MY_PROVIDER_API_KEY"]
    if (!hasKey) {
      return { autoload: false }
    }

    return {
      autoload: true,
      async getModel(sdk: any, modelID: string, options?: Record<string, any>) {
        // Специальная логика для вашего провайдера
        return sdk.languageModel(modelID, {
          ...options,
          customHeaders: {
            'X-My-Provider': 'true'
          }
        })
      },
      options: {
        apiKey: hasKey,
        baseURL: "https://api.my-provider.com/v1",
        timeout: 30000
      }
    }
  }
}

// 3. Добавьте в конфигурацию
const config = {
  provider: {
    "my-provider": {
      npm: "@ai-sdk/my-provider",
      api: "https://api.my-provider.com/v1",
      name: "My Provider",
      env: ["MY_PROVIDER_API_KEY"],
      models: {
        "my-model": {
          id: "my-model-id",
          name: "My Model",
          cost: { "input": 1, "output": 2 },
          limit: { "context": 32000, "output": 4000 },
          modalities: { "input": ["text"], "output": ["text"] }
        }
      }
    }
  }
}
```

### Обработка специфичных форматов

```typescript
// Специальная обработка для провайдера с уникальным API
async function getModel(sdk: any, modelID: string, options?: Record<string, any>) {
  // Создаем кастомный клиент
  const customClient = createCustomClient(options)

  // Обертка для совместимости с ai-sdk
  return {
    generate: async (params: any) => {
      // Преобразование параметров в формат провайдера
      const providerParams = transformToProviderFormat(params)
      
      // Вызов API провайдера
      const response = await customClient.generate(providerParams)
      
      // Преобразование ответа в формат ai-sdk
      return transformFromProviderFormat(response)
    },

    stream: async (params: any) => {
      // Аналогично для стриминга
      const providerParams = transformToProviderFormat(params)
      const stream = await customClient.stream(providerParams)
      
      return transformStreamFromProviderFormat(stream)
    }
  }
}
```

## Event System

### Подписка на события

```typescript
import { Bus } from './bus/index.ts'

// Подписка на все события
const unsubscribe = Bus.subscribeAll((event) => {
  console.log('Event:', event.type, event.properties)
})

// Подписка на конкретные события
const unsubscribeSession = Bus.subscribe('session.created', (event) => {
  console.log('Session created:', event.properties.sessionID)
})

// Отписка
unsubscribe()
```

### Создание событий

```typescript
import { Bus } from './bus/index.ts'

// Создание пользовательского события
Bus.emit('custom.event', {
  sessionID: 'ses_123',
  data: {
    custom: 'data'
  }
})

// События сессии
Bus.emit('session.created', {
  sessionID: 'ses_123',
  model: { providerID: 'polza', modelID: 'claude-sonnet-4.5' }
})

Bus.emit('session.message', {
  sessionID: 'ses_123',
  messageID: 'msg_456',
  parts: [{ type: 'text', text: 'Hello' }]
})

Bus.emit('session.completed', {
  sessionID: 'ses_123',
  result: {
    output: 'Response text',
    usage: { input: 100, output: 50 }
  }
})
```

### Типы событий

```typescript
// Основные события системы
const EVENT_TYPES = {
  // Сессии
  'session.created': 'session.created',
  'session.message': 'session.message', 
  'session.completed': 'session.completed',
  'session.error': 'session.error',
  'session.idle': 'session.idle',

  // Сообщения
  'message.part.updated': 'message.part.updated',
  'message.started': 'message.started',
  'message.completed': 'message.completed',

  // Инструменты
  'tool.started': 'tool.started',
  'tool.completed': 'tool.completed',
  'tool.error': 'tool.error',

  // Система
  'system.started': 'system.started',
  'system.stopped': 'system.stopped',
  'system.error': 'system.error'
} as const
```

## Лучшие практики

### 1. Обработка ошибок

```typescript
async execute(params, ctx) {
  try {
    // Основная логика
    const result = await riskyOperation(params)
    
    return {
      title: 'Operation completed',
      output: result.output,
      metadata: {
        status: 'success',
        timestamp: Date.now()
      }
    }
  } catch (error) {
    // Логирование ошибки
    console.error('Tool execution failed:', error)
    
    // Обновление метаданных
    ctx.metadata({
      metadata: {
        status: 'error',
        error: error.message,
        stack: error.stack
      }
    })

    // Бросаем понятную ошибку
    throw new Error(`Operation failed: ${error.message}`)
  }
}
```

### 2. Валидация входных данных

```typescript
async execute(params, ctx) {
  // Дополнительная валидация после Zod
  if (params.timeout && params.timeout > MAX_TIMEOUT) {
    throw new Error(`Timeout too large: ${params.timeout}. Maximum is ${MAX_TIMEOUT}`)
  }

  if (!params.command.trim()) {
    throw new Error('Command cannot be empty')
  }

  // Проверка безопасности
  if (containsDangerousCommands(params.command)) {
    throw new Error('Command contains potentially dangerous operations')
  }
}
```

### 3. Управление ресурсами

```typescript
async execute(params, ctx) {
  const controller = new AbortController()
  const cleanup = () => {
    controller.abort()
    // Очистка ресурсов
  }

  // Автоматическая очистка при завершении
  ctx.abort.addEventListener('abort', cleanup)

  try {
    const result = await fetchWithTimeout(params.url, {
      signal: controller.signal,
      timeout: params.timeout || 30000
    })

    return {
      title: 'API Request',
      output: `Request completed: ${result.status}`,
      metadata: {
        status: 'completed',
        statusCode: result.status
      }
    }
  } finally {
    cleanup()
  }
}
```

### 4. Логирование и отладка

```typescript
import { Log } from '../util/log.ts'

const log = Log.create({ service: 'my-tool' })

async execute(params, ctx) {
  using _ = log.time('execution')
  
  log.info('Starting execution', {
    sessionID: ctx.sessionID,
    params: params
  })

  try {
    const result = await performOperation(params)
    
    log.info('Execution completed', {
      sessionID: ctx.sessionID,
      resultSize: result.output.length
    })

    return result
  } catch (error) {
    log.error('Execution failed', {
      sessionID: ctx.sessionID,
      error: error.message
    })
    
    throw error
  }
}
```

### 5. Производительность

```typescript
// Кэширование дорогих операций
const cache = new Map<string, any>()

async execute(params, ctx) {
  const cacheKey = JSON.stringify(params)
  
  if (cache.has(cacheKey)) {
    log.info('Returning cached result')
    return cache.get(cacheKey)
  }

  const result = await expensiveOperation(params)
  
  // Кэширование с TTL
  cache.set(cacheKey, result)
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000) // 5 минут

  return result
}

// Батчинг запросов
async batchExecute(requests: Request[]) {
  const batches = chunkArray(requests, BATCH_SIZE)
  const results = []

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(request => this.execute(request))
    )
    results.push(...batchResults)
  }

  return results
}
```

Этот документ покрывает все основные аспекты разработки для Polza интеграции. Для получения дополнительной информации изучите исходный код в директории `src/`.