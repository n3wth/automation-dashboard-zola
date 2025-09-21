// Quick test script to verify dev auth headers are being sent

async function testAuthFlow() {
  console.log('Testing authentication flow...\n');

  // Simulate setting a dev user (like the login page does)
  if (typeof window !== 'undefined') {
    localStorage.setItem('guestUserId', 'dev-pro-001');
    console.log('✅ Set dev user in localStorage: dev-pro-001');
  }

  // Test the dev auth system
  try {
    const { devAuth } = await import('./lib/auth/dev-auth.js');

    // Check if dev user is detected
    const currentUser = devAuth.getCurrentDevUser();
    console.log('📋 Current dev user:', currentUser);

    // Check auth headers that would be sent
    const headers = devAuth.getDevAuthHeaders();
    console.log('🔧 Auth headers:', headers);

    // Test API call with headers
    const response = await fetch('/api/user-key-status', {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    console.log('🌐 API Response Status:', response.status);
    console.log('🌐 API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.status === 401) {
      console.log('❌ Still getting 401 - auth headers not working');
    } else {
      console.log('✅ Auth working - got non-401 response');
    }

  } catch (error) {
    console.error('❌ Error testing auth flow:', error);
  }
}

// Run the test
testAuthFlow();