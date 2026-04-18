#!/usr/bin/env node

/**
 * Script to set a user as admin in the database
 * Usage: node scripts/set-admin.js <user-email>
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setUserAsAdmin(email) {
  try {
    console.log(`Setting user ${email} as admin...`)
    
    // Update the user's profile to set is_staff = true
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_staff: true })
      .eq('email', email)
      .select()

    if (error) {
      console.error('Error updating user:', error)
      return
    }

    if (data && data.length > 0) {
      console.log(`✅ Successfully set ${email} as admin`)
      console.log('Updated profile:', data[0])
    } else {
      console.log(`❌ No user found with email: ${email}`)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.log('Usage: node scripts/set-admin.js <user-email>')
  console.log('Example: node scripts/set-admin.js user@example.com')
  process.exit(1)
}

setUserAsAdmin(email)
