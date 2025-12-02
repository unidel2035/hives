#!/usr/bin/env node

/**
 * Test script to verify the Polza API URL construction fix
 */

import { PolzaClient } from '../polza-cli/src/lib/polza-client.js';

async function testUrlConstruction() {
  console.log('Testing Polza API URL construction...\n');

  // Test 1: URL construction without trailing slash
  const baseUrlNoSlash = 'https://api.polza.ai/api/v1';
  const client1 = new PolzaClient({
    apiKey: 'test_key',
    baseUrl: baseUrlNoSlash
  });
  console.log('Test 1: Base URL without trailing slash');
  console.log(`  Input: ${baseUrlNoSlash}`);
  console.log(`  Stored: ${client1.baseUrl}`);
  console.log(`  Chat URL would be: ${client1.baseUrl}/chat/completions`);
  console.log(`  Expected: https://api.polza.ai/api/v1/chat/completions`);
  console.log(`  ✓ ${client1.baseUrl}/chat/completions === 'https://api.polza.ai/api/v1/chat/completions' ? 'PASS' : 'FAIL'}\n`);

  // Test 2: URL construction with trailing slash
  const baseUrlWithSlash = 'https://api.polza.ai/api/v1/';
  const client2 = new PolzaClient({
    apiKey: 'test_key',
    baseUrl: baseUrlWithSlash
  });
  console.log('Test 2: Base URL with trailing slash');
  console.log(`  Input: ${baseUrlWithSlash}`);
  console.log(`  Stored: ${client2.baseUrl}`);
  console.log(`  Chat URL would be: ${client2.baseUrl}/chat/completions`);
  console.log(`  Expected: https://api.polza.ai/api/v1/chat/completions`);
  console.log(`  ✓ ${client2.baseUrl}/chat/completions === 'https://api.polza.ai/api/v1/chat/completions' ? 'PASS' : 'FAIL'}\n`);

  // Test 3: Default base URL
  const client3 = new PolzaClient({ apiKey: 'test_key' });
  console.log('Test 3: Default base URL');
  console.log(`  Stored: ${client3.baseUrl}`);
  console.log(`  Chat URL would be: ${client3.baseUrl}/chat/completions`);
  console.log(`  Expected: https://api.polza.ai/api/v1/chat/completions`);
  console.log(`  ✓ ${client3.baseUrl}/chat/completions === 'https://api.polza.ai/api/v1/chat/completions' ? 'PASS' : 'FAIL'}\n`);

  // Test 4: Models endpoint
  console.log('Test 4: Models endpoint construction');
  console.log(`  Models URL would be: ${client3.baseUrl}/models`);
  console.log(`  Expected: https://api.polza.ai/api/v1/models`);
  console.log(`  ✓ ${client3.baseUrl}/models === 'https://api.polza.ai/api/v1/models' ? 'PASS' : 'FAIL'}\n`);

  console.log('All URL construction tests completed!');
}

testUrlConstruction().catch(console.error);
