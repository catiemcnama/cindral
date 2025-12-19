import { Container, Section } from '@/components/marketing/sections'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Cindral',
  description: 'Read the terms and conditions for using the Cindral platform.',
}

export default function TermsPage() {
  return (
    <>
      <section className="pt-32 pb-12 lg:pt-40">
        <Container className="max-w-3xl">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Terms of Service</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Last updated: December 19, 2024</p>
        </Container>
      </section>

      <Section className="pt-8">
        <Container className="max-w-3xl">
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <p className="lead">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Cindral platform and
              services. By using Cindral, you agree to these Terms.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Cindral, you agree to be bound by these Terms and our Privacy Policy. If you are
              using Cindral on behalf of an organization, you represent that you have the authority to bind that
              organization to these Terms.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Cindral provides a regulatory compliance platform that helps organizations track regulatory changes, map
              requirements to systems, and generate compliance documentation. The specific features available depend on
              your subscription plan.
            </p>

            <h2>3. Account Registration</h2>
            <p>To use Cindral, you must:</p>
            <ul>
              <li>Create an account with accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly notify us of any unauthorized access</li>
              <li>Be at least 18 years old or the legal age in your jurisdiction</li>
            </ul>
            <p>You are responsible for all activities that occur under your account.</p>

            <h2>4. Subscription and Billing</h2>
            <h3>4.1 Plans and Pricing</h3>
            <p>
              Cindral offers various subscription plans with different features and pricing. Current pricing is
              available on our website. We reserve the right to change pricing with 30 days&apos; notice.
            </p>

            <h3>4.2 Payment</h3>
            <p>
              Paid subscriptions are billed in advance on a monthly or annual basis. You authorize us to charge your
              payment method for all fees due.
            </p>

            <h3>4.3 Cancellation</h3>
            <p>
              You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing
              period. No refunds are provided for partial months.
            </p>

            <h2>5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the service</li>
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Reverse engineer, decompile, or disassemble the service</li>
              <li>Share your account credentials with third parties</li>
              <li>Upload malicious code or content</li>
            </ul>

            <h2>6. Your Data</h2>
            <h3>6.1 Ownership</h3>
            <p>
              You retain ownership of all data you upload to Cindral (&quot;Your Data&quot;). You grant us a limited
              license to use Your Data solely to provide the service to you.
            </p>

            <h3>6.2 Data Security</h3>
            <p>
              We implement industry-standard security measures to protect Your Data. However, no method of transmission
              or storage is 100% secure.
            </p>

            <h3>6.3 Data Export</h3>
            <p>
              You may export Your Data at any time using our export features. Upon termination, you will have 30 days to
              export Your Data before it is deleted.
            </p>

            <h2>7. Intellectual Property</h2>
            <p>
              Cindral and its content, features, and functionality are owned by Cindral Ltd and are protected by
              copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or
              create derivative works without our express permission.
            </p>

            <h2>8. Third-Party Services</h2>
            <p>
              Cindral may integrate with third-party services. Your use of such services is subject to their terms and
              privacy policies. We are not responsible for third-party services.
            </p>

            <h2>9. Disclaimer of Warranties</h2>
            <p>
              CINDRAL IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT
              WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
            <p>
              CINDRAL PROVIDES INFORMATION ABOUT REGULATIONS BUT DOES NOT PROVIDE LEGAL ADVICE. YOU SHOULD CONSULT WITH
              QUALIFIED LEGAL COUNSEL FOR SPECIFIC COMPLIANCE QUESTIONS.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CINDRAL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES. OUR TOTAL LIABILITY SHALL NOT
              EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>

            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold Cindral harmless from any claims, damages, or expenses arising from your
              use of the service or violation of these Terms.
            </p>

            <h2>12. Termination</h2>
            <p>
              We may suspend or terminate your access to Cindral at any time for violation of these Terms or for any
              other reason with notice. Upon termination, your right to use the service ceases immediately.
            </p>

            <h2>13. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify you of material changes via email or through the
              service. Your continued use after changes constitutes acceptance of the new Terms.
            </p>

            <h2>14. Governing Law</h2>
            <p>
              These Terms are governed by the laws of England and Wales. Any disputes shall be resolved in the courts of
              England and Wales.
            </p>

            <h2>15. General Provisions</h2>
            <ul>
              <li>
                <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and Cindral.
              </li>
              <li>
                <strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain
                in effect.
              </li>
              <li>
                <strong>Waiver:</strong> Failure to enforce any right does not constitute a waiver.
              </li>
              <li>
                <strong>Assignment:</strong> You may not assign these Terms without our consent.
              </li>
            </ul>

            <h2>16. Contact</h2>
            <p>For questions about these Terms, please contact us at:</p>
            <ul>
              <li>
                Email: <a href="mailto:legal@trycindral.com">legal@trycindral.com</a>
              </li>
              <li>Address: Cindral Ltd, London, United Kingdom</li>
            </ul>
          </div>
        </Container>
      </Section>
    </>
  )
}
