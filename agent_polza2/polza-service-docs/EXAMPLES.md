# Polza AI - Примеры интеграции

Готовые примеры кода для интеграции Polza AI в различные проекты через OpenAI-совместимый API.

## 📋 Содержание

- [JavaScript/Node.js](#-javascriptnodejs)
- [Python](#-python)
- [React/Frontend](#-reactfrontend)
- [CLI приложения](#-cli-приложения)
- [Backend API](#-backend-api)
- [Desktop приложения](#-desktop-приложения)
- [Интеграция с базами данных](#-интеграция-с-базами-данных)

## 🚀 JavaScript/Node.js

### Базовый клиент через OpenAI SDK

```bash
npm install openai
```

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
  baseURL: 'https://api.polza.ai/api/v1'
});

async function main() {
  // Базовый чат
  const response = await client.chat.completions.create({
    model: 'anthropic/claude-sonnet-4.5',
    messages: [{ role: 'user', content: 'Привет! Как дела?' }]
  });
  
  console.log(response.choices[0].message.content);
}

main().catch(console.error);
```

### Клиент с обработкой инструментов

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
  baseURL: 'https://api.polza.ai/api/v1'
});

class PolzaToolsClient {
  constructor(apiKey) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.polza.ai/api/v1'
    });
    this.toolExecutors = new Map();
  }

  registerTool(name, executor) {
    this.toolExecutors.set(name, executor);
  }

  async chatWithTools(messages, tools, options = {}) {
    // Первый запрос с инструментами
    const response = await this.client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      messages,
      tools,
      tool_choice: 'auto',
      ...options
    });

    const message = response.choices[0].message;
    
    if (message.tool_calls) {
      const toolResults = [];
      
      // Выполняем инструменты
      for (const toolCall of message.tool_calls) {
        const { name, arguments: args } = toolCall.function;
        const executor = this.toolExecutors.get(name);
        
        if (!executor) {
          throw new Error(`No executor registered for tool: ${name}`);
        }
        
        try {
          const parsedArgs = JSON.parse(args);
          const result = await executor(parsedArgs);
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(result)
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
      const finalResponse = await this.client.chat.completions.create({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [...messages, ...toolResults],
        ...options
      });
      
      return finalResponse;
    }
    
    return response;
  }
}

// Пример использования
const client = new PolzaToolsClient('ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo');

// Регистрируем инструменты
client.registerTool('get_weather', async ({ location }) => {
  // Имитация API погоды
  return {
    location,
    temperature: 20,
    condition: 'sunny'
  };
});

client.registerTool('calculate', async ({ expression }) => {
  const result = Function(`"use strict";return (${expression})`)();
  return { expression, result };
});

// Использование
async function main() {
  const tools = [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Получить погоду для города",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string" }
          },
          required: ["location"]
        }
      }
    },
    {
      type: "function", 
      function: {
        name: "calculate",
        description: "Выполнить вычисления",
        parameters: {
          type: "object",
          properties: {
            expression: { type: "string" }
          },
          required: ["expression"]
        }
      }
    }
  ];

  const response = await client.chatWithTools([
    { role: 'user', content: 'Какая погода в Москве? И посчитай 2+2*3' }
  ], tools);
  
  console.log(response.choices[0].message.content);
}
```

### Прямой HTTP клиент

```javascript
class PolzaClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.polza.ai/api/v1';
  }

  async chat(messages, options = {}) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages,
        max_tokens: options.maxTokens || 8192,
        temperature: options.temperature || 0.7,
        stream: options.stream || false
      })
    });

    if (!response.ok) {
      throw new Error(`Polza API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

// Использование
const client = new PolzaClient('ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo');

async function main() {
  const response = await client.chat([
    { role: 'user', content: 'Привет!' }
  ]);
  
  console.log(response.choices[0].message.content);
}
```

## 🐍 Python

### Базовый клиент через OpenAI SDK

```bash
pip install openai
```

```python
from openai import OpenAI

client = OpenAI(
    api_key="ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo",
    base_url="https://api.polza.ai/api/v1"
)

response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4.5",
    messages=[{"role": "user", "content": "Привет! Как дела?"}]
)

print(response.choices[0].message.content)
```

### Flask API сервер

```python
# polza_api_server.py
from flask import Flask, request, jsonify
from openai import OpenAI
import os

app = Flask(__name__)
client = OpenAI(
    api_key=os.getenv("POLZA_API_KEY", "ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo"),
    base_url="https://api.polza.ai/api/v1"
)

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        messages = data.get("messages", [])
        options = data.get("options", {})
        
        response = client.chat.completions.create(
            model="anthropic/claude-sonnet-4.5",
            messages=messages,
            **options
        )
            
        return jsonify(response.dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/models", methods=["GET"])
def get_models():
    try:
        response = client.models.list()
        return jsonify(response.dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
```

### FastAPI с инструментами

```python
# polza_fastapi.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import asyncio
import json
from openai import OpenAI

app = FastAPI(title="Polza AI API")

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    tools: Optional[List[Dict]] = []
    options: Optional[Dict[str, Any]] = {}

class ToolExecutor:
    def __init__(self):
        self.executors = {}

    def register_tool(self, name: str, func):
        self.executors[name] = func

    async def execute_tool(self, name: str, args: Dict[str, Any]):
        if name not in self.executors:
            raise Exception(f"Tool {name} not found")
        
        executor = self.executors[name]
        if asyncio.iscoroutinefunction(executor):
            return await executor(args)
        else:
            return executor(args)

tool_executor = ToolExecutor()

# Регистрируем инструменты
@tool_executor.register_tool("get_weather")
def get_weather(args):
    location = args.get("location", "Unknown")
    return {
        "location": location,
        "temperature": 20,
        "condition": "sunny"
    }

@tool_executor.register_tool("calculate")
def calculate(args):
    expression = args.get("expression", "0")
    try:
        result = eval(expression)  # В реальности используйте безопасный парсер
        return {"expression": expression, "result": result}
    except Exception as e:
        return {"error": str(e)}

client = OpenAI(
    api_key="ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo",
    base_url="https://api.polza.ai/api/v1"
)

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        messages = request.messages
        tools = request.tools
        options = request.options or {}
        
        # Первый запрос с инструментами
        response = client.chat.completions.create(
            model="anthropic/claude-sonnet-4.5",
            messages=messages,
            tools=tools,
            tool_choice="auto",
            **options
        )
        
        message = response.choices[0].message
        
        if message.tool_calls:
            tool_results = []
            
            for tool_call in message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)
                
                try:
                    result = await tool_executor.execute_tool(tool_name, tool_args)
                    tool_results.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "content": json.dumps(result)
                    })
                except Exception as e:
                    tool_results.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "content": json.dumps({"error": str(e)})
                    })
            
            # Продолжаем диалог с результатами
            final_response = client.chat.completions.create(
                model="anthropic/claude-sonnet-4.5",
                messages=messages + tool_results,
                **options
            )
            return jsonify(final_response.dict())
        
        return jsonify(response.dict())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## ⚛️ React/Frontend

### React компонент

```jsx
// PolzaChat.jsx
import React, { useState, useEffect } from 'react';
import OpenAI from 'openai';

const PolzaChat = ({ apiKey }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.polza.ai/api/v1'
  });

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await client.chat.completions.create({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [...messages, userMessage]
      });

      const assistantMessage = response.choices[0].message;
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Извините, произошла ошибка.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <strong>{message.role === 'user' ? 'Вы' : 'AI'}:</strong>
            <p>{message.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <strong>AI:</strong>
            <p>Печатает...</p>
          </div>
        )}
      </div>
      
      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите сообщение..."
          rows={3}
        />
        <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
          Отправить
        </button>
      </div>
    </div>
  );
};

export default PolzaChat;
```

### React с инструментами

```jsx
// PolzaChatWithTools.jsx
import React, { useState } from 'react';
import OpenAI from 'openai';

const PolzaChatWithTools = ({ apiKey }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tools] = useState([
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Получить погоду для города",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string", description: "Название города" }
          },
          required: ["location"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "search_web",
        description: "Поиск в интернете",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Поисковый запрос" }
          },
          required: ["query"]
        }
      }
    }
  ]);

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.polza.ai/api/v1'
  });

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Первый запрос с инструментами
      const response = await client.chat.completions.create({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [...messages, userMessage],
        tools: tools,
        tool_choice: "auto"
      });

      const assistantMessage = response.choices[0].message;
      
      if (assistantMessage.tool_calls) {
        // Обрабатываем tool calls
        const toolResults = [];
        
        for (const toolCall of assistantMessage.tool_calls) {
          const { name, arguments: args } = toolCall.function;
          
          try {
            const parsedArgs = JSON.parse(args);
            let result;
            
            // Выполняем инструменты
            if (name === 'get_weather') {
              result = { location: parsedArgs.location, temperature: 20, condition: 'sunny' };
            } else if (name === 'search_web') {
              result = { query: parsedArgs.query, results: [`Результат для ${parsedArgs.query}`] };
            } else {
              result = { error: `Unknown tool: ${name}` };
            }
            
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify(result)
            });
          } catch (error) {
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify({ error: error.message })
            });
          }
        }
        
        // Продолжаем диалог с результатами
        const finalResponse = await client.chat.completions.create({
          model: 'anthropic/claude-sonnet-4.5',
          messages: [...messages, userMessage, assistantMessage, ...toolResults]
        });
        
        setMessages(prev => [...prev, finalResponse.choices[0].message]);
      } else {
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Извините, произошла ошибка.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const insertToolExample = (toolName) => {
    const examples = {
      get_weather: "Какая погода в Москве?",
      search_web: "Найди информацию о React 18"
    };
    
    setInput(examples[toolName] || '');
  };

  return (
    <div className="chat-container">
      <div className="tool-examples">
        <p>Попробуйте:</p>
        <button onClick={() => insertToolExample('get_weather')}>
          Погода в Москве
        </button>
        <button onClick={() => insertToolExample('search_web')}>
          Поиск про React
        </button>
      </div>
      
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <strong>{message.role === 'user' ? 'Вы' : 'AI'}:</strong>
            <div className="content">
              {message.content}
              {message.tool_calls && (
                <div className="tool-calls">
                  <p><em>Использовал инструменты:</em></p>
                  {message.tool_calls.map((call, i) => (
                    <div key={i} className="tool-call">
                      <code>{call.function.name}</code>
                      <pre>{call.function.arguments}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <strong>AI:</strong>
            <p>Печатает...</p>
          </div>
        )}
      </div>
      
      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Задайте вопрос или попросите выполнить действие..."
          rows={3}
        />
        <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
          Отправить
        </button>
      </div>
    </div>
  );
};

export default PolzaChatWithTools;
```

## 💻 CLI приложения

### Node.js CLI

```javascript
#!/usr/bin/env node
// polza-cli.js

import readline from 'readline';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.POLZA_API_KEY || 'ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
  baseURL: 'https://api.polza.ai/api/v1'
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Вы: '
});

const messages = [];

console.log('🤖 Polza AI CLI - Введите сообщение или "quit" для выхода');
rl.prompt();

rl.on('line', async (line) => {
  if (line.toLowerCase() === 'quit' || line.toLowerCase() === 'exit') {
    rl.close();
    return;
  }

  if (!line.trim()) {
    rl.prompt();
    return;
  }

  const userMessage = { role: 'user', content: line };
  messages.push(userMessage);

  try {
    console.log('AI: ', end='');
    
    const response = await client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      messages,
      stream: true
    });
    
    let fullResponse = '';
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        process.stdout.write(content);
        fullResponse += content;
      }
    }
    
    console.log(); // Новая строка после ответа
    
    if (fullResponse) {
      messages.push({ role: 'assistant', content: fullResponse });
    }
  } catch (error) {
    console.error('\nОшибка:', error.message);
  }
  
  rl.prompt();
});

rl.on('close', () => {
  console.log('\n👋 До свидания!');
  process.exit(0);
});
```

### Python CLI

```python
#!/usr/bin/env python3
# polza_cli.py

import os
import sys
from openai import OpenAI

class PolzaCLI:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("POLZA_API_KEY", "ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo"),
            base_url="https://api.polza.ai/api/v1"
        )
        self.messages = []
        
    def run(self):
        print("🤖 Polza AI CLI - Введите сообщение или 'quit' для выхода")
        
        while True:
            try:
                user_input = input("Вы: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'выход']:
                    print("👋 До свидания!")
                    break
                    
                if not user_input:
                    continue
                    
                self.messages.append({"role": "user", "content": user_input})
                
                try:
                    response = self.client.chat.completions.create(
                        model="anthropic/claude-sonnet-4.5",
                        messages=self.messages
                    )
                    
                    ai_message = response.choices[0].message.content
                    print(f"AI: {ai_message}")
                    
                    self.messages.append({"role": "assistant", "content": ai_message})
                    
                except Exception as e:
                    print(f"Ошибка: {e}")
                    
            except KeyboardInterrupt:
                print("\n👋 До свидания!")
                break
            except EOFError:
                print("\n👋 До свидания!")
                break

if __name__ == "__main__":
    cli = PolzaCLI()
    cli.run()
```

## 🔧 Backend API

### Express.js сервер

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const client = new OpenAI({
  apiKey: process.env.POLZA_API_KEY || 'ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
  baseURL: 'https://api.polza.ai/api/v1'
});

app.use(cors());
app.use(express.json());

// Базовый чат
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, options = {} } = req.body;
    
    const response = await client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      messages,
      ...options
    });
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Чат с инструментами
app.post('/api/chat-tools', async (req, res) => {
  try {
    const { messages, tools, options = {} } = req.body;
    
    // Первый запрос с инструментами
    const response = await client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      messages,
      tools,
      tool_choice: 'auto',
      ...options
    });
    
    const message = response.choices[0].message;
    
    if (message.tool_calls) {
      // В реальном приложении здесь будет выполнение инструментов
      const toolResults = message.tool_calls.map(toolCall => ({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: JSON.stringify({ result: 'Tool executed', tool: toolCall.function.name })
      }));
      
      // Продолжаем диалог с результатами
      const finalResponse = await client.chat.completions.create({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [...messages, ...toolResults],
        ...options
      });
      
      res.json(finalResponse);
    } else {
      res.json(response);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Список моделей
app.get('/api/models', async (req, res) => {
  try {
    const response = await client.models.list();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Polza API server running on port ${PORT}`);
});
```

## 📱 Desktop приложения

### Electron приложение

```javascript
// main.js (Electron main process)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const OpenAI = require('openai');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Глобальный доступ к клиенту Polza
  global.polzaClient = new OpenAI({
    apiKey: process.env.POLZA_API_KEY || 'ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
    baseURL: 'https://api.polza.ai/api/v1'
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Polza AI Desktop</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .messages {
            height: 400px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 20px;
        }
        .input-container {
            display: flex;
            gap: 10px;
        }
        textarea {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #0056b3;
        }
        .message {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 4px;
        }
        .user {
            background-color: #e3f2fd;
        }
        .assistant {
            background-color: #f3e5f5;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Polza AI Desktop</h1>
        <div class="messages" id="messages"></div>
        <div class="input-container">
            <textarea id="input" placeholder="Введите сообщение..." rows="3"></textarea>
            <button onclick="sendMessage()">Отправить</button>
        </div>
    </div>

    <script>
        let messages = [];

        async function sendMessage() {
            const input = document.getElementById('input');
            const messageText = input.value.trim();
            
            if (!messageText) return;

            // Добавляем сообщение пользователя
            addMessage('user', messageText);
            messages.push({ role: 'user', content: messageText });
            input.value = '';

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages })
                });

                const data = await response.json();
                const aiMessage = data.choices[0].message.content;
                
                addMessage('assistant', aiMessage);
                messages.push({ role: 'assistant', content: aiMessage });
                
            } catch (error) {
                addMessage('assistant', 'Ошибка: ' + error.message);
            }
        }

        function addMessage(role, content) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${role}`;
            messageDiv.innerHTML = `<strong>${role === 'user' ? 'Вы' : 'AI'}:</strong> ${content}`;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // Отправка по Enter
        document.getElementById('input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    </script>
</body>
</html>
```

## 🗄️ Интеграция с базами данных

### PostgreSQL интеграция

```javascript
// postgres-integration.js
const { Pool } = require('pg');
const OpenAI = require('openai');

class PolzaPostgreSQL {
  constructor(apiKey, dbConfig) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.polza.ai/api/v1'
    });
    this.pool = new Pool(dbConfig);
  }

  async query(query, params = []) {
    return await this.pool.query(query, params);
  }

  async chatWithDatabase(messages, options = {}) {
    const tools = [
      {
        type: "function",
        function: {
          name: "sql_query",
          description: "Выполнить SQL запрос к PostgreSQL",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "SQL запрос"
              },
              params: {
                type: "array",
                description: "Параметры запроса"
              }
            },
            required: ["query"]
          }
        }
      }
    ];

    const response = await this.client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      messages,
      tools,
      tool_choice: 'auto',
      ...options
    });

    const message = response.choices[0].message;
    
    if (message.tool_calls) {
      const toolResults = [];
      
      for (const toolCall of message.tool_calls) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await this.executeSQL(args.query, args.params);
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(result)
          });
        } catch (error) {
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify({ error: error.message })
          });
        }
      }
      
      // Продолжаем диалог с результатами
      const finalResponse = await this.client.chat.completions.create({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [...messages, ...toolResults],
        ...options
      });
      
      return finalResponse;
    }
    
    return response;
  }

  async executeSQL(query, params = []) {
    try {
      // Базовая проверка безопасности
      const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT'];
      const upperQuery = query.toUpperCase();
      
      for (const keyword of dangerousKeywords) {
        if (upperQuery.includes(keyword)) {
          return {
            success: false,
            error: `Запросы с ${keyword} не разрешены для безопасности`
          };
        }
      }

      const result = await this.query(query, params);
      return {
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields.map(f => f.name)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Использование
const polzaDB = new PolzaPostgreSQL(
  process.env.POLZA_API_KEY || 'ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
  {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'username',
    password: 'password'
  }
);

// Express маршрут
app.post('/api/chat-db', async (req, res) => {
  try {
    const { messages, options = {} } = req.body;
    
    const response = await polzaDB.chatWithDatabase(messages, options);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Эти примеры показывают реальные способы интеграции Polza AI в различные типы приложений, используя только OpenAI-совместимый API без выдуманных SDK.