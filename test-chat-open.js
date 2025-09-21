// Test script to verify chat opening functionality
const chatId = '6acac358-0e13-42c5-817c-cb3130fe659e';
const url = `http://localhost:3000/c/${chatId}`;

console.log('Testing chat opening functionality...');
console.log('Chat ID:', chatId);
console.log('URL:', url);
console.log('\nTo test:');
console.log('1. Open your browser');
console.log('2. Navigate to:', url);
console.log('3. You should see "Loading automation chat..." briefly');
console.log('4. Then the chat should load');
console.log('\nNote: The route is /c/[chatId] not /chat/[chatId]');
console.log('\nAlternatively, run this curl command:');
console.log(`curl -v "${url}" 2>&1 | grep -E "HTTP|Location"`);