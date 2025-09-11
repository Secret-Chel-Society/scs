// Simple test script to test the waiver API
const testWaiverAPI = async () => {
  try {
    console.log('Testing waiver API...')
    
    const response = await fetch('http://localhost:3000/api/waivers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ playerId: 'test-player-id' })
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('Response body:', text)
    
    try {
      const json = JSON.parse(text)
      console.log('Parsed JSON:', JSON.stringify(json, null, 2))
    } catch (parseError) {
      console.log('Failed to parse as JSON:', parseError.message)
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testWaiverAPI()
