#!/usr/bin/env tsx
/**
 * Test email sending via Resend
 * Usage: npm run test:email -- your@email.com
 */

import 'dotenv/config'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'Cindral <notifications@trycindral.com>'

async function testEmail() {
  const testTo = process.argv[2]

  if (!testTo) {
    console.error('❌ Usage: npm run test:email -- your@email.com')
    process.exit(1)
  }

  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not set in environment')
    process.exit(1)
  }

  console.log('📧 Testing Resend email...')
  console.log(`   From: ${EMAIL_FROM}`)
  console.log(`   To: ${testTo}`)
  console.log(`   API Key: ${RESEND_API_KEY.substring(0, 10)}...`)
  console.log('')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [testTo],
        subject: '✅ Cindral Email Test',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #0ea5e9; font-size: 24px; margin-bottom: 20px;">🎉 Email is working!</h1>
            <p style="color: #374151; line-height: 1.6;">
              This is a test email from <strong>Cindral</strong>. If you're seeing this, your Resend integration is properly configured.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #166534; margin: 0; font-size: 14px;">
                ✅ RESEND_API_KEY is valid<br>
                ✅ Domain is authorized<br>
                ✅ Email delivery working
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Sent at: ${new Date().toISOString()}
            </p>
          </div>
        `,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Failed to send email:')
      console.error(JSON.stringify(data, null, 2))

      // Helpful error messages
      if (data.message?.includes('domain')) {
        console.log('\n💡 Tip: You need to verify your domain in Resend:')
        console.log('   1. Go to https://resend.com/domains')
        console.log('   2. Add trycindral.com')
        console.log('   3. Add the DNS records to GoDaddy')
        console.log('   4. Wait for verification (usually 1-5 minutes)')
      }

      process.exit(1)
    }

    console.log('✅ Email sent successfully!')
    console.log(`   ID: ${data.id}`)
    console.log(`\n📬 Check your inbox at ${testTo}`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

testEmail()
