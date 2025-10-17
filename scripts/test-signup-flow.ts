import { config } from 'dotenv'

// Load environment variables
config()

async function testSignupFlow() {
  try {
    console.log('🧪 Testing New Signup Flow APIs...\n')
    
    // Test 1: onboard-user endpoint
    console.log('1. Testing onboard-user endpoint...')
    try {
      const onboardResponse = await fetch('http://localhost:3001/api/stablesrail/onboard-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bvn: '12345678901' })
      })
      
      const onboardData = await onboardResponse.json()
      console.log('   Status:', onboardResponse.status)
      console.log('   Response:', JSON.stringify(onboardData, null, 2))
      
      if (onboardResponse.status === 200) {
        console.log('   ✅ onboard-user endpoint is working')
      } else {
        console.log('   ⚠️  onboard-user endpoint returned error (expected for test BVN)')
      }
    } catch (error) {
      console.log('   ❌ onboard-user endpoint error:', error)
    }
    
    // Test 2: verify-otp endpoint
    console.log('\n2. Testing verify-otp endpoint...')
    try {
      const otpResponse = await fetch('http://localhost:3001/api/stablesrail/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'test-session-id', otp: '123456' })
      })
      
      const otpData = await otpResponse.json()
      console.log('   Status:', otpResponse.status)
      console.log('   Response:', JSON.stringify(otpData, null, 2))
      
      if (otpResponse.status === 200) {
        console.log('   ✅ verify-otp endpoint is working')
      } else {
        console.log('   ⚠️  verify-otp endpoint returned error (expected for test data)')
      }
    } catch (error) {
      console.log('   ❌ verify-otp endpoint error:', error)
    }
    
    // Test 3: signup endpoint
    console.log('\n3. Testing signup endpoint...')
    try {
      const signupResponse = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phoneNumber: '1234567890',
          dateOfBirth: '1990-01-01',
          sr_user_id: 'test-sr-user-id',
          correlation_id: 'test-correlation-id'
        })
      })
      
      const signupData = await signupResponse.json()
      console.log('   Status:', signupResponse.status)
      console.log('   Response:', JSON.stringify(signupData, null, 2))
      
      if (signupResponse.status === 200) {
        console.log('   ✅ signup endpoint is working')
      } else {
        console.log('   ⚠️  signup endpoint returned error (expected for test data)')
      }
    } catch (error) {
      console.log('   ❌ signup endpoint error:', error)
    }
    
    console.log('\n🎉 API endpoint tests completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Navigate to http://localhost:3001/signup')
    console.log('2. Test the 3-step signup flow:')
    console.log('   - Step 1: Enter a valid BVN and click "Verify BVN"')
    console.log('   - Step 2: Enter the OTP received and click "Verify OTP"')
    console.log('   - Step 3: Fill in your details and click "Create Account"')
    console.log('3. Check browser console for any errors')
    console.log('4. Verify account creation in Supabase dashboard')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testSignupFlow()
