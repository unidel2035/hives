# Polza AI - Инструменты (Tools)

Руководство по созданию и использованию инструментов в Polza AI.

## 📋 Содержание

- [Обзор инструментов](#-обзор-инструментов)
- [Создание инструментов](#-создание-инструментов)
- [Использование инструментов](#-использование-инструментов)
- [Примеры инструментов](#-примеры-инструментов)
- [Обработка результатов](#-обработка-результатов)
- [Продвинутые техники](#-продвинутые-техники)

## 🔧 Обзор инструментов

Инструменты (Tools) позволяют Claude взаимодействовать с внешними системами, базами данных, API и выполнять различные действия.

### Возможности инструментов

- ✅ **Внешние API** - интеграция с REST API
- ✅ **Базы данных** - выполнение SQL запросов
- ✅ **Файловые операции** - чтение и запись файлов
- ✅ **Вычисления** - сложные математические операции
- ✅ **Веб-скрапинг** - извлечение данных с сайтов
- ✅ **Системные команды** - выполнение shell команд
- ✅ **Кастомная логика** - любая бизнес-логика

### Архитектура работы

```
1. Пользователь отправляет запрос
2. Claude анализирует и решает использовать инструмент
3. API возвращает tool_call с параметрами
4. Ваше приложение выполняет инструмент
5. Результат отправляется обратно Claude
6. Claude формирует финальный ответ
```

## 🛠️ Создание инструментов

### Базовая структура

```javascript
const tools = [
  {
    type: "function",
    function: {
      name: "tool_name",
      description: "Описание того, что делает инструмент",
      parameters: {
        type: "object",
        properties: {
          param1: {
            type: "string",
            description: "Описание параметра"
          },
          param2: {
            type: "integer",
            description: "Числовой параметр",
            minimum: 1,
            maximum: 100
          }
        },
        required: ["param1"]
      }
    }
  }
];
```

### Параметры инструмента

#### Типы данных
```json
{
  "parameters": {
    "type": "object",
    "properties": {
      "string_param": {
        "type": "string",
        "description": "Строковый параметр"
      },
      "number_param": {
        "type": "number", 
        "description": "Числовой параметр"
      },
      "boolean_param": {
        "type": "boolean",
        "description": "Логический параметр"
      },
      "array_param": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Массив строк"
      },
      "object_param": {
        "type": "object",
        "properties": {
          "nested_field": {
            "type": "string"
          }
        },
        "description": "Вложенный объект"
      }
    }
  }
}
```

#### Валидация параметров
```json
{
  "parameters": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "format": "email",
        "description": "Email адрес"
      },
      "age": {
        "type": "integer",
        "minimum": 18,
        "maximum": 120,
        "description": "Возраст пользователя"
      },
      "status": {
        "type": "string",
        "enum": ["active", "inactive", "pending"],
        "description": "Статус пользователя"
      }
    },
    "required": ["email", "age"]
  }
}
```

## 🚀 Использование инструментов

### 1. Определение инструментов в запросе

```javascript
const response = await fetch('https://api.polza.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'anthropic/claude-sonnet-4.5',
    messages: [
      {
        role: 'user',
        content: 'Найди информацию о погоде в Москве'
      }
    ],
    tools: [
      // Здесь определяем инструменты
    ],
    tool_choice: "auto" // или "none" или конкретный инструмент
  })
});
```

### 2. Обработка tool_calls

```javascript
async function handleToolCalls(response) {
  const result = await response.json();
  const message = result.choices[0].message;
  
  if (message.tool_calls) {
    const toolResults = [];
    
    for (const toolCall of message.tool_calls) {
      const { name, arguments: args } = toolCall.function;
      
      try {
        const parsedArgs = JSON.parse(args);
        const toolResult = await executeTool(name, parsedArgs);
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(toolResult)
        });
      } catch (error) {
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify({ error: error.message })
        });
      }
    }
    
    // Продолжаем диалог с результатами инструментов
    return await continueConversation(toolResults);
  }
  
  return result;
}
```

### 3. Выполнение инструментов

```javascript
async function executeTool(name, args) {
  switch (name) {
    case 'get_weather':
      return await getWeather(args.location, args.units);
    case 'search_web':
      return await searchWeb(args.query, args.limit);
    case 'calculate':
      return await performCalculation(args.expression);
    case 'read_file':
      return await readFile(args.file_path);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

## 📝 Примеры инструментов

### 1. Инструмент погоды

```javascript
const weatherTool = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Получить текущую погоду для указанного города",
    parameters: {
      type: "object",
      properties: {
        "location": {
          "type": "string",
          "description": "Название города (например, 'Москва', 'London')"
        },
        "units": {
          "type": "string",
          "enum": ["celsius", "fahrenheit"],
          "description": "Единицы измерения температуры",
          "default": "celsius"
        }
      },
      "required": ["location"]
    }
  }
};

async function getWeather(location, units = 'celsius') {
  // Имитация API погоды
  const mockWeatherData = {
    location,
    temperature: units === 'celsius' ? 15 : 59,
    condition: 'sunny',
    humidity: 65,
    wind_speed: 10
  };
  
  return mockWeatherData;
}
```

### 2. Инструмент поиска в интернете

```javascript
const webSearchTool = {
  type: "function",
  function: {
    name: "search_web",
    description: "Поиск информации в интернете",
    parameters: {
      type: "object",
      properties: {
        "query": {
          "type": "string",
          "description": "Поисковый запрос"
        },
        "limit": {
          "type": "integer",
          "description": "Количество результатов",
          "default": 5,
          "minimum": 1,
          "maximum": 10
        }
      },
      "required": ["query"]
    }
  }
};

async function searchWeb(query, limit = 5) {
  // Реальная реализация с использованием поискового API
  const results = [
    {
      title: `Результат 1 для: ${query}`,
      url: "https://example.com/1",
      snippet: "Описание первого результата..."
    },
    {
      title: `Результат 2 для: ${query}`,
      url: "https://example.com/2", 
      snippet: "Описание второго результата..."
    }
  ];
  
  return {
    query,
    results: results.slice(0, limit),
    total_results: results.length
  };
}
```

### 3. Инструмент базы данных

```javascript
const databaseTool = {
  type: "function",
  function: {
    name: "query_database",
    description: "Выполнить SQL запрос к базе данных",
    parameters: {
      type: "object",
      properties: {
        "query": {
          "type": "string",
          "description": "SQL запрос для выполнения"
        },
        "database": {
          "type": "string",
          "description": "Название базы данных",
          "enum": ["users", "products", "orders"]
        }
      },
      "required": ["query"]
    }
  }
};

async function queryDatabase(query, database) {
  // Безопасное выполнение SQL (используйте prepared statements!)
  try {
    const result = await db.query(query, { database });
    
    return {
      success: true,
      rows: result.rows,
      row_count: result.rowCount,
      execution_time: result.executionTime
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      query: query
    };
  }
}
```

### 4. Инструмент вычислений

```javascript
const calculatorTool = {
  type: "function",
  function: {
    name: "calculate",
    description: "Выполнить математические вычисления",
    parameters: {
      type: "object",
      properties: {
        "expression": {
          "type": "string",
          "description": "Математическое выражение (например, '2 + 3 * 4')"
        },
        "precision": {
          "type": "integer",
          "description": "Точность результата",
          "default": 2,
          "minimum": 0,
          "maximum": 10
        }
      },
      "required": ["expression"]
    }
  }
};

async function calculate(expression, precision = 2) {
  // Безопасное вычисление (используйте библиотеку для парсинга!)
  const safeEval = (expr) => {
    // Простейшая реализация - в реальности используйте mathjs или similar
    const allowedChars = /^[0-9+\-*/().\s]+$/;
    if (!allowedChars.test(expr)) {
      throw new Error('Недопустимые символы в выражении');
    }
    return Function('"use strict";return (' + expr + ')')();
  };
  
  try {
    const result = safeEval(expression);
    return {
      expression,
      result: Number(result.toFixed(precision)),
      precision
    };
  } catch (error) {
    return {
      expression,
      error: error.message
    };
  }
}
```

### 5. Инструмент работы с файлами

```javascript
const fileTool = {
  type: "function",
  function: {
    name: "read_file",
    description: "Прочитать содержимое файла",
    parameters: {
      type: "object",
      properties: {
        "file_path": {
          "type": "string",
          "description": "Путь к файлу"
        },
        "encoding": {
          "type": "string",
          "description": "Кодировка файла",
          "default": "utf-8"
        }
      },
      "required": ["file_path"]
    }
  }
};

async function readFile(file_path, encoding = 'utf-8') {
  try {
    const fs = require('fs').promises;
    const content = await fs.readFile(file_path, encoding);
    
    return {
      file_path,
      encoding,
      content,
      size: content.length,
      lines: content.split('\n').length
    };
  } catch (error) {
    return {
      file_path,
      error: error.message
    };
  }
}
```

## 🔄 Обработка результатов

### Форматы результатов

#### Успешный результат
```json
{
  "success": true,
  "data": {
    "temperature": 15,
    "condition": "sunny"
  },
  "metadata": {
    "timestamp": "2024-01-01T12:00:00Z",
    "source": "weather_api"
  }
}
```

#### Ошибка
```json
{
  "success": false,
  "error": "Файл не найден",
  "code": "FILE_NOT_FOUND",
  "details": {
    "file_path": "/path/to/file.txt"
  }
}
```

### Продолжение диалога

```javascript
async function continueConversation(toolResults) {
  const response = await fetch('https://api.polza.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [
        // Предыдущие сообщения
        ...previousMessages,
        // Результаты инструментов
        ...toolResults
      ]
    })
  });
  
  return await response.json();
}
```

## ⚡ Продвинутые техники

### 1. Инструменты с состоянием

```javascript
class DatabaseTool {
  constructor(connection) {
    this.connection = connection;
  }
  
  async execute(query, params = {}) {
    // Используем состояние для подключения
    return await this.connection.query(query, params);
  }
  
  getToolDefinition() {
    return {
      type: "function",
      function: {
        name: "db_query",
        description: "Выполнить запрос к базе данных",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "SQL запрос"
            },
            params: {
              type: "object",
              description: "Параметры запроса"
            }
          },
          required: ["query"]
        }
      }
    };
  }
}
```

### 2. Инструменты с асинхронными операциями

```javascript
const asyncTool = {
  type: "function",
  function: {
    name: "long_running_task",
    description: "Выполнить длительную задачу",
    parameters: {
      type: "object",
      properties: {
        "task_id": {
          "type": "string",
          "description": "ID задачи"
        }
      },
      "required": ["task_id"]
    }
  }
};

async function longRunningTask(task_id) {
  // Запускаем задачу асинхронно
  const taskPromise = performLongTask(task_id);
  
  // Возвращаем информацию о статусе
  return {
    task_id,
    status: "started",
    message: "Задача запущена, проверьте статус позже"
  };
}

// Периодически проверяем статус
async function checkTaskStatus(task_id) {
  const status = await getTaskStatus(task_id);
  return {
    task_id,
    ...status
  };
}
```

### 3. Инструменты с валидацией

```javascript
function createValidatedTool(toolDef, validator) {
  return {
    type: "function",
    function: {
      name: toolDef.function.name,
      description: toolDef.function.description,
      parameters: {
        ...toolDef.function.parameters,
        additionalProperties: false
      }
    }
  };
}

// Использование
const validatedWeatherTool = createValidatedTool(weatherTool, {
  location: (value) => /^[a-zA-Z\s]+$/.test(value),
  units: (value) => ['celsius', 'fahrenheit'].includes(value)
});
```

### 4. Инструменты с кэшированием

```javascript
class CachedTool {
  constructor(ttl = 300000) { // 5 минут по умолчанию
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  async execute(name, args) {
    const cacheKey = `${name}:${JSON.stringify(args)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.result;
    }
    
    const result = await this.executeTool(name, args);
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    return result;
  }
  
  async executeTool(name, args) {
    switch (name) {
      case 'get_weather':
        return await getWeather(args.location);
      case 'search_web':
        return await searchWeb(args.query);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
```

### 5. Инструменты с логированием

```javascript
function createLoggingTool(toolExecutor) {
  return {
    async execute(name, args) {
      const startTime = Date.now();
      const logEntry = {
        tool: name,
        args,
        timestamp: new Date().toISOString()
      };
      
      console.log('Executing tool:', logEntry);
      
      try {
        const result = await toolExecutor(name, args);
        const duration = Date.now() - startTime;
        
        console.log('Tool completed:', {
          tool: name,
          duration,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        console.error('Tool failed:', {
          tool: name,
          duration,
          error: error.message
        });
        
        throw error;
      }
    }
  };
}
```

## 🎯 Лучшие практики

### 1. Безопасность
- Всегда валидируйте входные параметры
- Используйте prepared statements для SQL
- Проверяйте права доступа к файлам
- Ограничивайте выполнение системных команд

### 2. Обработка ошибок
```javascript
async function safeToolExecute(toolName, args) {
  try {
    return await executeTool(toolName, args);
  } catch (error) {
    return {
      success: false,
      error: error.message,
      tool: toolName,
      args
    };
  }
}
```

### 3. Производительность
- Используйте кэширование для дорогих операций
- Реализуйте таймауты для внешних API
- Оптимизируйте базы данных и запросы
- Мониторьте использование ресурсов

### 4. Мониторинг
```javascript
function trackToolUsage(toolName, args, result) {
  const metrics = {
    tool: toolName,
    timestamp: Date.now(),
    args_size: JSON.stringify(args).length,
    result_size: JSON.stringify(result).length,
    success: result.success !== false
  };
  
  // Отправляем в систему мониторинга
  analytics.track('tool_execution', metrics);
}
```

Инструменты Polza AI открывают широкие возможности для создания мощных AI-приложений с доступом к внешним системам и данным.