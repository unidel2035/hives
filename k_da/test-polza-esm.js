#!/usr/bin/env node

/**
 * Простой тест Polza AI клиента в собранном k_da.js (ESM версия)
 */

console.log('🧪 Тестирование Polza AI клиента в k_da.js\n');

async function testPolza() {
  try {
    // Загружаем собранный k_da
    const { polzaAI } = await import('./k_da.js');

    // Инициализация клиента
    console.log('📡 Инициализация Polza AI клиента...');
    const client = polzaAI.init({
      model: 'anthropic/claude-sonnet-4.5'
    });

    if (!client) {
      console.log('❌ Polza AI клиент не инициализирован');
      console.log('💡 Проверьте, что POLZA_API_KEY установлен в .env');
      return;
    }

    console.log('✅ Polza AI клиент инициализирован успешно');

    // Тест 1: Простое завершение
    console.log('\n📝 Тест 1: Простое завершение...');
    try {
      const response = await polzaAI.complete('Скажи "Привет от Polza AI!"');
      console.log('✅ Ответ:', response);
    } catch (error) {
      console.log('⚠️ Ошибка завершения (ожидается без реального API ключа):', error.message);
    }

    // Тест 2: Список моделей
    console.log('\n📋 Тест 2: Список моделей...');
    try {
      const models = await client.listModels();
      console.log('✅ Получен ответ от API моделей');
      console.log('📊 Доступно моделей:', models.data?.length || 0);
    } catch (error) {
      console.log('⚠️ Ошибка получения моделей (ожидается без реального API ключа):', error.message);
    }

    console.log('\n🎉 Тест завершен!');
    console.log('\n💡 Для реального тестирования:');
    console.log('   1. Получите API ключ на https://polza.ai');
    console.log('   2. Установите: POLZA_API_KEY=ak_ваш_ключ');
    console.log('   3. Пересоберите: node build.js');
    console.log('   4. Запустите этот тест снова');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    console.error('🔍 Stack trace:', error.stack);
  }
}

testPolza();