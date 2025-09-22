const { default: fetch } = require('node-fetch');

async function testFetch() {
  try {
    console.log('Testing fetch to google.com...');
    const response = await fetch('https://google.com');
    console.log('Fetch successful! Status:', response.status);
  } catch (error) {
    console.error('Fetch failed:', error.message);
  }
}

testFetch().catch(console.error);