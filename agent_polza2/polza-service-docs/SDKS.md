# Polza AI - Реальные способы интеграции

Поскольку Polza AI использует OpenAI-совместимый API, интеграция осуществляется через существующие OpenAI SDK и библиотеки.

## 📋 Содержание

- [OpenAI SDK](#-openai-sdk)
- [Прямая HTTP интеграция](#-прямая-http-интеграция)
- [Популярные фреймворки](#-популярные-фреймворки)
- [UI библиотеки](#-ui-библиотеки)
- [Утилиты](#-утилиты)

## 🔧 OpenAI SDK

### JavaScript/TypeScript

#### Официальный OpenAI SDK
```bash
npm install openai
```

```javascript
import OpenAI from 'openai';

// Создание клиента с базовым URL Polza
const client = new OpenAI({
  apiKey: 'ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
  baseURL: 'https://api.polza.ai/api/v1'
});

// Использование аналогично OpenAI
const completion = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [{ role: 'user', content: 'Привет!' }]
});

console.log(completion.choices[0].message.content);
```

#### С инструментами (Function Calling)
```javascript
// Определяем инструменты
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
  }
];

// Функция выполнения инструментов
async function executeTool(name, args) {
  if (name === 'get_weather') {
    // Реальная реализация получения погоды
    return { temperature: 20, condition: 'sunny' };
  }
  throw new Error(`Unknown tool: ${name}`);
}

// Использование
const completion = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [{ role: 'user', content: 'Какая погода в Москве?' }],
  tools,
  tool_choice: "auto"
});

const message = completion.choices[0].message;

// Обработка tool calls
if (message.tool_calls) {
  const toolResults = [];
  
  for (const toolCall of message.tool_calls) {
    const args = JSON.parse(toolCall.function.arguments);
    const result = await executeTool(toolCall.function.name, args);
    
    toolResults.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(result)
    });
  }
  
  // Продолжаем диалог с результатами
  const finalCompletion = await client.chat.completions.create({
    model: 'anthropic/claude-sonnet-4.5',
    messages: [
      { role: 'user', content: 'Какая погода в Москве?' },
      { role: 'assistant', tool_calls: message.tool_calls },
      ...toolResults
    ]
  });
  
  console.log(finalCompletion.choices[0].message.content);
}
```

### Python

#### Официальный OpenAI SDK
```bash
pip install openai
```

```python
from openai import OpenAI

# Создание клиента
client = OpenAI(
    api_key="ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo",
    base_url="https://api.polza.ai/api/v1"
)

# Базовое использование
completion = client.chat.completions.create(
    model="anthropic/claude-sonnet-4.5",
    messages=[{"role": "user", "content": "Привет!"}]
)

print(completion.choices[0].message.content)
```

#### С инструментами
```python
from openai import OpenAI

client = OpenAI(
    api_key="ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo",
    base_url="https://api.polza.ai/api/v1"
)

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Получить погоду для города",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            }
        }
    }
]

async def execute_tool(name, args):
    if name == 'get_weather':
        # Реальная реализация
        return {"temperature": 20, "condition": "sunny"}
    raise Exception(f"Unknown tool: {name}")

# Использование
completion = client.chat.completions.create(
    model="anthropic/claude-sonnet-4.5",
    messages=[{"role": "user", "content": "Какая погода в Москве?"}],
    tools=tools,
    tool_choice="auto"
)

message = completion.choices[0].message

if message.tool_calls:
    tool_results = []
    
    for tool_call in message.tool_calls:
        args = eval(tool_call.function.arguments)  # В реальности используйте json.loads
        result = await execute_tool(tool_call.function.name, args)
        
        tool_results.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result)
        })
    
    # Продолжаем диалог
    final_completion = client.chat.completions.create(
        model="anthropic/claude-sonnet-4.5",
        messages=[
            {"role": "user", "content": "Какая погода в Москве?"},
            {"role": "assistant", "tool_calls": message.tool_calls},
            *tool_results
        ]
    )
    
    print(final_completion.choices[0].message.content)
```

## 🌐 Прямая HTTP интеграция

### JavaScript (Fetch API)
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

  async chatWithTools(messages, tools, options = {}) {
    return await this.chat(messages, {
      ...options,
      tools,
      tool_choice: 'auto'
    });
  }
}

// Использование
const client = new PolzaClient('ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo');

const response = await client.chat([
  { role: 'user', content: 'Привет!' }
]);

console.log(response.choices[0].message.content);
```

### Python (Requests)
```python
import requests
import json

class PolzaClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.polza.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def chat(self, messages, **options):
        data = {
            "model": "anthropic/claude-sonnet-4.5",
            "messages": messages,
            **options
        }
        
        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers=self.headers,
            json=data
        )
        
        if response.status_code != 200:
            raise Exception(f"Polza API Error: {response.status_code} - {response.text}")
            
        return response.json()

    def chat_with_tools(self, messages, tools, **options):
        return self.chat(messages, tools=tools, tool_choice="auto", **options)

# Использование
client = PolzaClient("ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo")

response = client.chat([
    {"role": "user", "content": "Привет!"}
])

print(response["choices"][0]["message"]["content"])
```

### Go
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

type PolzaClient struct {
    apiKey  string
    baseURL string
}

type Message struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}

type ChatRequest struct {
    Model    string    `json:"model"`
    Messages []Message `json:"messages"`
    MaxTokens int      `json:"max_tokens,omitempty"`
    Temperature float64 `json:"temperature,omitempty"`
}

type ChatResponse struct {
    Choices []struct {
        Message Message `json:"message"`
    } `json:"choices"`
}

func NewPolzaClient(apiKey string) *PolzaClient {
    return &PolzaClient{
        apiKey:  apiKey,
        baseURL: "https://api.polza.ai/api/v1",
    }
}

func (c *PolzaClient) Chat(messages []Message, options ...func(*ChatRequest)) (*ChatResponse, error) {
    req := &ChatRequest{
        Model:    "anthropic/claude-sonnet-4.5",
        Messages: messages,
        MaxTokens: 8192,
        Temperature: 0.7,
    }
    
    for _, option := range options {
        option(req)
    }
    
    jsonData, err := json.Marshal(req)
    if err != nil {
        return nil, err
    }
    
    resp, err := http.Post(
        fmt.Sprintf("%s/chat/completions", c.baseURL),
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("Polza API Error: %d - %s", resp.StatusCode, string(body))
    }
    
    var result ChatResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    return &result, nil
}

// Использование
func main() {
    client := NewPolzaClient("ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo")
    
    messages := []Message{
        {Role: "user", Content: "Привет!"},
    }
    
    response, err := client.Chat(messages)
    if err != nil {
        panic(err)
    }
    
    fmt.Println(response.Choices[0].Message.Content)
}
```

### Rust
```rust
use reqwest;
use serde::{Deserialize, Serialize};
use tokio;

#[derive(Debug, Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<Message>,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: Message,
}

pub struct PolzaClient {
    api_key: String,
    base_url: String,
    client: reqwest::Client,
}

impl PolzaClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            base_url: "https://api.polza.ai/api/v1".to_string(),
            client: reqwest::Client::new(),
        }
    }

    pub async fn chat(&self, messages: Vec<Message>) -> Result<String, Box<dyn std::error::Error>> {
        let request = ChatRequest {
            model: "anthropic/claude-sonnet-4.5".to_string(),
            messages,
            max_tokens: Some(8192),
            temperature: Some(0.7),
        };

        let response = self.client
            .post(&format!("{}/chat/completions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(format!("Polza API Error: {}", error_text).into());
        }

        let result: ChatResponse = response.json().await?;
        
        if let Some(choice) = result.choices.first() {
            Ok(choice.message.content.clone())
        } else {
            Err("No response from Polza".into())
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = PolzaClient::new("ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo".to_string());
    
    let messages = vec![
        Message {
            role: "user".to_string(),
            content: "Привет!".to_string(),
        }
    ];
    
    let response = client.chat(messages).await?;
    println!("{}", response);
    
    Ok(())
}
```

## 🏗️ Популярные фреймворки

### LangChain (Python)
```bash
pip install langchain
```

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain

# Создание модели с Polza
llm = ChatOpenAI(
    openai_api_key="ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo",
    openai_api_base="https://api.polza.ai/api/v1",
    model_name="anthropic/claude-sonnet-4.5"
)

# Создание цепочки
prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}")
])

chain = LLMChain(llm=llm, prompt=prompt)

# Использование
response = chain.run(input="Привет!")
print(response)
```

### LangChain (JavaScript)
```bash
npm install @langchain/openai
```

```javascript
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";

const model = new ChatOpenAI({
  openAIApiKey: 'ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
  openAIApiBase: 'https://api.polza.ai/api/v1',
  modelName: 'anthropic/claude-sonnet-4.5'
});

const prompt = ChatPromptTemplate.fromMessages([
  ["human", "{input}"]
]);

const chain = new LLMChain({ llm: model, prompt });

const response = await chain.call({ input: "Привет!" });
console.log(response.text);
```

### LlamaIndex (Python)
```bash
pip install llama-index
```

```python
from llama_index.llms.openai import OpenAI as LlamaOpenAI
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

# Создание LLM с Polza
llm = LlamaOpenAI(
    api_key="ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo",
    api_base="https://api.polza.ai/api/v1",
    model="anthropic/claude-sonnet-4.5"
)

# Создание индекса документов
documents = SimpleDirectoryReader("docs").load_data()
index = VectorStoreIndex.from_documents(documents)

# Создание query engine
query_engine = index.as_query_engine(llm=llm)

# Использование
response = query_engine.query("Что содержится в документах?")
print(response)
```

### Haystack (Python)
```bash
pip install haystack-ai
```

```python
from haystack.components.generators import OpenAIGenerator
from haystack import Pipeline

# Создание генератора с Polza
generator = OpenAIGenerator(
    api_key="ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo",
    api_base="https://api.polza.ai/api/v1",
    model="anthropic/claude-sonnet-4.5"
)

# Создание pipeline
pipeline = Pipeline()
pipeline.add_component("generator", generator)

# Использование
result = pipeline.run({"query": "Привет!"})
print(result["generator"]["replies"][0])
```

## 🎨 UI библиотеки

### React
```jsx
import React, { useState } from 'react';
import OpenAI from 'openai';

const PolzaChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const client = new OpenAI({
    apiKey: 'ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
    baseURL: 'https://api.polza.ai/api/v1'
  });

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const completion = await client.chat.completions.create({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [...messages, userMessage]
      });

      const assistantMessage = completion.choices[0].message;
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

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <strong>{message.role === 'user' ? 'Вы' : 'AI'}:</strong>
            <p>{message.content}</p>
          </div>
        ))}
        {isLoading && <div className="loading">Печатает...</div>}
      </div>
      
      <div className="input-container">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Введите сообщение..."
        />
        <button onClick={sendMessage} disabled={isLoading}>
          Отправить
        </button>
      </div>
    </div>
  );
};

export default PolzaChat;
```

### Vue.js
```vue
<template>
  <div class="chat-container">
    <div class="messages">
      <div v-for="(message, index) in messages" :key="index" :class="`message ${message.role}`">
        <strong>{{ message.role === 'user' ? 'Вы' : 'AI' }}:</strong>
        <p>{{ message.content }}</p>
      </div>
      <div v-if="isLoading" class="loading">Печатает...</div>
    </div>
    
    <div class="input-container">
      <input
        v-model="input"
        @keypress="handleKeyPress"
        placeholder="Введите сообщение..."
      />
      <button @click="sendMessage" :disabled="isLoading">
        Отправить
      </button>
    </div>
  </div>
</template>

<script>
import OpenAI from 'openai';

export default {
  data() {
    return {
      messages: [],
      input: '',
      isLoading: false,
      client: null
    };
  },
  
  mounted() {
    this.client = new OpenAI({
      apiKey: 'ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo',
      baseURL: 'https://api.polza.ai/api/v1'
    });
  },
  
  methods: {
    async sendMessage() {
      if (!this.input.trim()) return;

      const userMessage = { role: 'user', content: this.input };
      this.messages.push(userMessage);
      this.input = '';
      this.isLoading = true;

      try {
        const completion = await this.client.chat.completions.create({
          model: 'anthropic/claude-sonnet-4.5',
          messages: [...this.messages, userMessage]
        });

        const assistantMessage = completion.choices[0].message;
        this.messages.push(assistantMessage);
      } catch (error) {
        console.error('Error:', error);
        this.messages.push({
          role: 'assistant',
          content: 'Извините, произошла ошибка.'
        });
      } finally {
        this.isLoading = false;
      }
    },
    
    handleKeyPress(e) {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    }
  }
};
</script>
```

## 🔧 Утилиты

### Счетчик токенов
```javascript
// Простая оценка токенов (приблизительно)
function estimateTokens(text) {
  // Приблизительно: 1 токен ≈ 4 символа для английского, 2-3 для русского
  return Math.ceil(text.length / 3);
}

function calculateCost(usage, model = 'anthropic/claude-sonnet-4.5') {
  const pricing = {
    'anthropic/claude-sonnet-4.5': {
      input: 3,   // $3 за 1M входных токенов
      output: 15  // $15 за 1M выходных токенов
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
```

### Обработка ошибок
```javascript
class PolzaError extends Error {
  constructor(message, status, type) {
    super(message);
    this.name = 'PolzaError';
    this.status = status;
    this.type = type;
  }
}

async function safePolzaCall(apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    if (error.response) {
      // API ошибка
      const data = await error.response.json();
      throw new PolzaError(
        data.error?.message || 'Unknown API error',
        error.response.status,
        data.error?.type
      );
    } else if (error.request) {
      // Сетевая ошибка
      throw new PolzaError('Network error', 0, 'network_error');
    } else {
      // Другая ошибка
      throw new PolzaError(error.message, 0, 'unknown_error');
    }
  }
}

// Использование
try {
  const response = await safePolzaCall(() => 
    client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [{ role: 'user', content: 'Привет!' }]
    })
  );
  console.log(response.choices[0].message.content);
} catch (error) {
  if (error instanceof PolzaError) {
    console.error(`Polza API Error (${error.status}): ${error.message}`);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Rate Limiting
```javascript
class RateLimiter {
  constructor(maxRequestsPerMinute = 60) {
    this.maxRequests = maxRequestsPerMinute;
    this.requests = [];
  }

  async acquire() {
    const now = Date.now();
    
    // Удаляем старые запросы (старше 1 минуты)
    this.requests = this.requests.filter(time => now - time < 60000);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 60000 - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire(); // Рекурсивно проверяем снова
    }
    
    this.requests.push(now);
  }
}

// Использование
const limiter = new RateLimiter(60); // 60 запросов в минуту

async function limitedChat(messages) {
  await limiter.acquire();
  
  return await client.chat.completions.create({
    model: 'anthropic/claude-sonnet-4.5',
    messages
  });
}
```

Эти примеры показывают реальные способы интеграции Polza AI через OpenAI-совместимый API без выдуманных SDK.