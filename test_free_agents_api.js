// Test Free Agents API
const fetch = require('node-fetch');

async function testFreeAgentsAPI() {
  try {
    console.log('Testing Free Agents API...');
    
    const response = await fetch('http://localhost:3000/api/free-agents', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.freeAgents) {
      console.log(`Found ${data.freeAgents.length} free agents`);
    }
    
    if (data.debug) {
      console.log('Debug info:', data.debug);
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testFreeAgentsAPI();
