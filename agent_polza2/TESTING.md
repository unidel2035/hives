# Тестирование Polza и OpenCode моделей

Этот файл содержит инструкции по тестированию различных моделей в системе.

## Быстрый старт

### 1. Тестирование Polza (Claude)

```bash
# Базовый тест - кто я?
echo 'ты кто?' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5

# Тест программирования
echo 'напиши простую функцию на Python для сложения двух чисел' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5

# Тест анализа кода
echo 'проанализируй файл src/index.js и объясни его структуру' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5
```

### 2. Тестирование OpenCode (Grok)

```bash
# Базовый тест - кто я?
echo 'ты кто?' | bun run src/index.js --model opencode/grok-code

# Тест программирования
echo 'напиши простую функцию на Python для сложения двух чисел' | bun run src/index.js --model opencode/grok-code

# Тест анализа кода
echo 'проанализируй файл src/index.js и объясни его структуру' | bun run src/index.js --model opencode/grok-code
```

## Подробное тестирование

### Тесты для Polza (Claude)

#### Тест 1: Базовая идентификация
```bash
echo 'ты кто?' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5
```
**Ожидаемый результат**: Claude должен представиться как Claude от Anthropic, а не как OpenCode.

#### Тест 2: Программирование
```bash
echo 'создай функцию на JavaScript для сортировки массива чисел' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5
```
**Ожидаемый результат**: Корректный код на JavaScript с объяснениями.

#### Тест 3: Работа с файлами
```bash
echo 'прочитай файл README.md и кратко опиши проект' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5
```
**Ожидаемый результат**: Claude должен прочитать файл и дать краткое описание.

#### Тест 4: Bash команды
```bash
echo 'покажи список файлов в директории src/tool/' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5
```
**Ожидаемый результат**: Список файлов с описанием.

#### Тест 5: Поиск по коду
```bash
echo 'найди все функции в файлах TypeScript которые содержат слово "provider"' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5
```
**Ожидаемый результат**: Найденные файлы и функции.

### Тесты для OpenCode (Grok)

#### Тест 1: Базовая идентификация
```bash
echo 'ты кто?' | bun run src/index.js --model opencode/grok-code
```
**Ожидаемый результат**: Grok должен представиться как AI-агент на модели Grok Code Fast.

#### Тест 2: Программирование
```bash
echo 'создай функцию на Python для нахождения факториала числа' | bun run src/index.js --model opencode/grok-code
```
**Ожидаемый результат**: Корректный код на Python.

#### Тест 3: Работа с Git
```bash
echo 'покажи статус git репозитория' | bun run src/index.js --model opencode/grok-code
```
**Ожидаемый результат**: Информация о статусе репозитория.

#### Тест 4: Анализ кода
```bash
echo 'объясни что делает функция в файле src/session/prompt.ts' | bun run src/index.js --model opencode/grok-code
```
**Ожидаемый результат**: Объяснение кода.

## Сравнительные тесты

### Тест 1: Сложная задача программирования
```bash
# Polza
echo 'напиши класс для работы с базой данных SQLite на Python с методами создания таблиц и CRUD операций' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5

# Grok
echo 'напиши класс для работы с базой данных SQLite на Python с методами создания таблиц и CRUD операций' | bun run src/index.js --model opencode/grok-code
```

### Тест 2: Анализ ошибок
```bash
# Polza
echo 'найди и объясни ошибки в этом коде: def divide(a, b): return a / b if b != 0 else None' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5

# Grok  
echo 'найди и объясни ошибки в этом коде: def divide(a, b): return a / b if b != 0 else None' | bun run src/index.js --model opencode/grok-code
```

## Конфигурация

### Polza конфигурация
Файл `polza-config-example.json` уже содержит API ключ по умолчанию:
- **API ключ**: `ak_0xCOU-hEsCsImB6r-dg7GChm2LFPQOUL9ROwExY8WBo`
- **Модель**: `polza/claude-sonnet-4.5`
- **URL**: `https://api.polza.ai/api/v1`

### OpenCode конфигурация
OpenCode модели используют встроенную конфигурацию:
- **Модель по умолчанию**: `opencode/grok-code`
- **Дополнительные модели**: смотрите `MODELS.md`

## Возможные проблемы

### Polza не работает
1. Проверьте наличие файла `polza-config-example.json`
2. Убедитесь что API ключ корректный
3. Проверьте подключение к интернету

### OpenCode не работает
1. Проверьте наличие интернет-соединения
2. Убедитесь что модель `opencode/grok-code` доступна

### Модели отвечают неправильно
1. **Polza отвечает как OpenCode**: возможно проблема с системным промптом
2. **OpenCode не отвечает**: возможно проблема с подключением к API

## Устранение неполадок

### Включение отладки
Для включения отладочных сообщений добавьте `DEBUG=true`:
```bash
DEBUG=true echo 'тест' | OPENCODE_CONFIG=polza-config-example.json bun run src/index.js --model polza/claude-sonnet-4.5
```

### Проверка конфигурации
```bash
# Проверить Polza конфигурацию
cat polza-config-example.json

# Проверить локальную конфигурацию
cat .opencode/config.json
```

### Тест SDK
```bash
# Тест Polza SDK
bun run test-sdk.mjs

# Тест Polza API
bun run test-polza-api.mjs
```

## Дополнительные команды

### Список доступных моделей
```bash
bun run src/index.js --help
```

### Тест без конфигурации
```bash
# Тест без Polza конфигурации (должен использовать OpenCode)
echo 'тест' | bun run src/index.js --model opencode/grok-code
```

### Пользовательская конфигурация
Создайте собственный файл конфигурации:
```bash
cp polza-config-example.json my-config.json
# Отредактируйте my-config.json под ваши нужды
echo 'тест' | OPENCODE_CONFIG=my-config.json bun run src/index.js --model polza/claude-sonnet-4.5
```