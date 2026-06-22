import { createAdminClient } from '../lib/supabase/admin'
import { config } from 'dotenv'

// Load environment variables
config()

async function testVirtualAccountFlow() {
  try {
    console.log('🧪 Testing Virtual Account Flow...\n')
    
    const admin = createAdminClient()
    
    // 1. Check if wallet_address table exists and is accessible
    console.log('1. Checking wallet_address table...')
    const { data: walletTest, error: walletError } = await admin
      .from('wallet_address')
      .select('id')
      .limit(1)
    
    if (walletError) {
      console.log('❌ wallet_address table error:', walletError.message)
    } else {
      console.log('✅ wallet_address table is accessible')
    }
    
    // 2. Check if virtual_accounts table exists
    console.log('\n2. Checking virtual_accounts table...')
    const { data: vaTest, error: vaError } = await admin
      .from('virtual_accounts')
      .select('id')
      .limit(1)
    
    if (vaError) {
      console.log('❌ virtual_accounts table error:', vaError.message)
    } else {
      console.log('✅ virtual_accounts table is accessible')
    }
    
    // 3. Check if profiles table has sr_user_id column
    console.log('\n3. Checking profiles table structure...')
    const { data: profileTest, error: profileError } = await admin
      .from('profiles')
      .select('id, sr_user_id')
      .limit(1)
    
    if (profileError) {
      console.log('❌ profiles table error:', profileError.message)
    } else {
      console.log('✅ profiles table is accessible')
      console.log('   Sample profile structure:', Object.keys(profileTest?.[0] || {}))
    }
    
    // 4. Test API endpoint availability (without auth)
    console.log('\n4. Testing API endpoint availability...')
    try {
      const response = await fetch('http://localhost:3001/api/sr/create-virtual-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await response.json()
      if (response.status === 401) {
        console.log('✅ API endpoint is accessible (returns 401 as expected without auth)')
      } else {
        console.log('⚠️  API endpoint returned unexpected status:', response.status, data)
      }
    } catch (error) {
      console.log('❌ API endpoint test failed:', error)
    }
    
    console.log('\n🎉 Basic tests completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Navigate to http://localhost:3001/home')
    console.log('2. Look for the "Create Virtual Account" button in the dashboard')
    console.log('3. Click the button to test the full flow')
    console.log('4. Check browser console for any errors')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testVirtualAccountFlow()
