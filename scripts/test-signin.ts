/**
 * Manual test script for the sign-in process
 *
 * This script can be run to test the sign-in process end-to-end
 * without having to go through the UI.
 */

import { signIn } from "@/lib/actions/auth"

async function testSignIn() {
  console.log("Starting sign-in test...")

  // Test with missing credentials
  console.log("\nTest 1: Missing credentials")
  const formData1 = new FormData()
  const result1 = await signIn(formData1)
  console.log("Result:", result1)

  // Test with invalid credentials
  console.log("\nTest 2: Invalid credentials")
  const formData2 = new FormData()
  formData2.append("email", "nonexistent@example.com")
  formData2.append("password", "wrongpassword")
  const result2 = await signIn(formData2)
  console.log("Result:", result2)

  // Test with valid credentials (replace with actual test credentials)
  console.log("\nTest 3: Valid credentials")
  const formData3 = new FormData()
  formData3.append("email", "test@example.com")
  formData3.append("password", "testpassword")
  const result3 = await signIn(formData3)
  console.log("Result:", {
    ...result3,
    jwt: result3.jwt ? "[JWT PRESENT]" : null,
    session: result3.session ? "[SESSION PRESENT]" : null,
  })

  console.log("\nSign-in test completed")
}

// Run the test
testSignIn().catch((error) => {
  console.error("Test failed with error:", error)
})
