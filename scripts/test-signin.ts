/**
 * Manual test script for the sign-in process
 *
 * This script can be run to test the sign-in process end-to-end
 * without having to go through the UI.
 */

import { signIn } from "@/lib/actions/auth"

async function testSignIn() {

  // Test with missing credentials
  const formData1 = new FormData()
  const result1 = await signIn(formData1)

  // Test with invalid credentials
  const formData2 = new FormData()
  formData2.append("email", "nonexistent@example.com")
  formData2.append("password", "wrongpassword")
  const result2 = await signIn(formData2)

  // Test with valid credentials (replace with actual test credentials)
  const formData3 = new FormData()
  formData3.append("email", "test@example.com")
  formData3.append("password", "testpassword")
  const result3 = await signIn(formData3)
    ...result3,
    jwt: result3.jwt ? "[JWT PRESENT]" : null,
    session: result3.session ? "[SESSION PRESENT]" : null,
  })

}

// Run the test
testSignIn().catch((error) => {
})
