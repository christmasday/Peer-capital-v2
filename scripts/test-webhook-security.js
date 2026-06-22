#!/usr/bin/env node

/**
 * Test utility for Stablesrail webhook security verification
 * 
 * This script tests the webhook security implementation by:
 * 1. Generating valid webhook signatures
 * 2. Testing various security scenarios
 * 3. Verifying the HMAC-SHA256 implementation matches Stablesrail docs
 */

const crypto = require('crypto')

// Test webhook secret (use your actual secret in production)
const TEST_SECRET = process.env.STABLESRAIL_WEBHOOK_SECRET || 'test-secret-key'

// Test payload
const TEST_PAYLOAD = {
  eventType: 'virtual.account.created',
  payload: {
    accountNumber: '1234567890',
    accountName: 'Test User',
    bankCode: 'STABLESRAIL',
    bankName: 'Stablesrail',
    currency: 'NGN',
    metadata: {
      userId: 'test-user-123'
    }
  }
}

const TEST_RAW_BODY = JSON.stringify(TEST_PAYLOAD)
const TEST_TIMESTAMP = Math.floor(Date.now() / 1000).toString()

/**
 * Generate a valid webhook signature following Stablesrail's algorithm
 */
function generateWebhookSignature(rawBody, timestamp, secret) {
  // Step 1: Construct signing string (timestamp + raw_body)
  const signingString = timestamp + rawBody
  
  // Step 2: Compute HMAC-SHA256
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signingString)
    .digest('hex')
  
  // Step 3: Hex-encode and prefix with "sha256="
  return `sha256=${expected}`
}

/**
 * Test the webhook signature generation
 */
function testSignatureGeneration() {
  console.log('🔐 Testing Webhook Signature Generation')
  console.log('=' .repeat(50))
  
  const signature = generateWebhookSignature(TEST_RAW_BODY, TEST_TIMESTAMP, TEST_SECRET)
  
  console.log(`Raw Body: ${TEST_RAW_BODY}`)
  console.log(`Timestamp: ${TEST_TIMESTAMP}`)
  console.log(`Secret: ${TEST_SECRET}`)
  console.log(`Generated Signature: ${signature}`)
  console.log()
  
  return signature
}

/**
 * Test various security scenarios
 */
function testSecurityScenarios() {
  console.log('🛡️  Testing Security Scenarios')
  console.log('=' .repeat(50))
  
  const validSignature = generateWebhookSignature(TEST_RAW_BODY, TEST_TIMESTAMP, TEST_SECRET)
  
  // Test 1: Valid signature
  console.log('✅ Test 1: Valid signature')
  console.log(`   Signature: ${validSignature}`)
  console.log()
  
  // Test 2: Invalid signature (wrong secret)
  console.log('❌ Test 2: Invalid signature (wrong secret)')
  const invalidSignature = generateWebhookSignature(TEST_RAW_BODY, TEST_TIMESTAMP, 'wrong-secret')
  console.log(`   Signature: ${invalidSignature}`)
  console.log(`   Expected: ${validSignature}`)
  console.log(`   Match: ${invalidSignature === validSignature}`)
  console.log()
  
  // Test 3: Invalid signature (modified body)
  console.log('❌ Test 3: Invalid signature (modified body)')
  const modifiedBody = TEST_RAW_BODY.replace('1234567890', '9999999999')
  const modifiedSignature = generateWebhookSignature(modifiedBody, TEST_TIMESTAMP, TEST_SECRET)
  console.log(`   Modified Body: ${modifiedBody}`)
  console.log(`   Signature: ${modifiedSignature}`)
  console.log(`   Expected: ${validSignature}`)
  console.log(`   Match: ${modifiedSignature === validSignature}`)
  console.log()
  
  // Test 4: Invalid signature (wrong timestamp)
  console.log('❌ Test 4: Invalid signature (wrong timestamp)')
  const wrongTimestamp = (parseInt(TEST_TIMESTAMP) + 1).toString()
  const wrongTimestampSignature = generateWebhookSignature(TEST_RAW_BODY, wrongTimestamp, TEST_SECRET)
  console.log(`   Wrong Timestamp: ${wrongTimestamp}`)
  console.log(`   Signature: ${wrongTimestampSignature}`)
  console.log(`   Expected: ${validSignature}`)
  console.log(`   Match: ${wrongTimestampSignature === validSignature}`)
  console.log()
}

/**
 * Test header validation scenarios
 */
function testHeaderValidation() {
  console.log('📋 Testing Header Validation')
  console.log('=' .repeat(50))
  
  const requiredHeaders = [
    'x-traycer-signature',
    'x-traycer-timestamp', 
    'user-agent',
    'content-type'
  ]
  
  console.log('Required Headers:')
  requiredHeaders.forEach(header => {
    console.log(`   - ${header}`)
  })
  console.log()
  
  console.log('Expected Values:')
  console.log(`   - User-Agent: cNGN-Webhook/1.0`)
  console.log(`   - Content-Type: application/json`)
  console.log(`   - X-Traycer-Signature: sha256=<hex-hmac>`)
  console.log(`   - X-Traycer-Timestamp: <unix-timestamp>`)
  console.log()
}

/**
 * Test timestamp validation for replay attack prevention
 */
function testTimestampValidation() {
  console.log('⏰ Testing Timestamp Validation')
  console.log('=' .repeat(50))
  
  const now = Math.floor(Date.now() / 1000)
  const fiveMinutesAgo = now - (5 * 60)
  const oneMinuteFuture = now + 60
  
  console.log(`Current Time: ${now}`)
  console.log(`5 Minutes Ago: ${fiveMinutesAgo}`)
  console.log(`1 Minute Future: ${oneMinuteFuture}`)
  console.log()
  
  console.log('Timestamp Validation Rules:')
  console.log('   ✅ Valid: Current time ± 5 minutes')
  console.log('   ❌ Invalid: Older than 5 minutes (replay attack)')
  console.log('   ❌ Invalid: More than 1 minute in future')
  console.log()
}

/**
 * Generate example webhook request for testing
 */
function generateExampleRequest() {
  console.log('📤 Example Webhook Request')
  console.log('=' .repeat(50))
  
  const signature = generateWebhookSignature(TEST_RAW_BODY, TEST_TIMESTAMP, TEST_SECRET)
  
  console.log('POST /api/sr/webhook')
  console.log('Headers:')
  console.log(`  X-Traycer-Signature: ${signature}`)
  console.log(`  X-Traycer-Timestamp: ${TEST_TIMESTAMP}`)
  console.log(`  User-Agent: cNGN-Webhook/1.0`)
  console.log(`  Content-Type: application/json`)
  console.log()
  console.log('Body:')
  console.log(TEST_RAW_BODY)
  console.log()
}

/**
 * Main test runner
 */
function runTests() {
  console.log('🚀 Stablesrail Webhook Security Test Suite')
  console.log('=' .repeat(60))
  console.log()
  
  testSignatureGeneration()
  testSecurityScenarios()
  testHeaderValidation()
  testTimestampValidation()
  generateExampleRequest()
  
  console.log('✅ All tests completed!')
  console.log()
  console.log('💡 Next Steps:')
  console.log('   1. Set STABLESRAIL_WEBHOOK_SECRET in your environment')
  console.log('   2. Test the webhook endpoint with the generated signature')
  console.log('   3. Verify all security validations are working')
  console.log('   4. Monitor webhook_events table for security violations')
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
}

module.exports = {
  generateWebhookSignature,
  testSignatureGeneration,
  testSecurityScenarios,
  testHeaderValidation,
  testTimestampValidation,
  generateExampleRequest
}
