const fetch = require('node-fetch');

async function testRoleAPI() {
  try {
    // First, let's login to get a token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin', // Adjust as needed
        password: 'admin123' // Adjust as needed
      })
    });

    if (!loginResponse.ok) {
      console.log('Login failed. Please check credentials or manually get a token.');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Login successful, got token');

    // Now fetch roles
    const rolesResponse = await fetch('http://localhost:5000/api/roles', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const rolesData = await rolesResponse.json();
    console.log('API Response:', JSON.stringify(rolesData, null, 2));

    if (rolesData.roles) {
      rolesData.roles.forEach(role => {
        console.log(`\n=== ${role.name} ===`);
        console.log('Finance permissions:', JSON.stringify(role.permissions.finance, null, 2));
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRoleAPI();