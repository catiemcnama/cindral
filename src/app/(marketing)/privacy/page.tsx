import { Container, Section } from '@/components/marketing/sections'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Cindral',
  description: 'Learn how Cindral collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <>
      <section className="pt-32 pb-12 lg:pt-40">
        <Container className="max-w-3xl">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">Last updated: December 19, 2024</p>
        </Container>
      </section>

      <Section className="pt-8">
        <Container className="max-w-3xl">
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <p className="lead">
              At Cindral, we take your privacy seriously. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our platform.
            </p>

            <h2>Information We Collect</h2>
            <h3>Information You Provide</h3>
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li>
                <strong>Account Information:</strong> Name, email address, company name, and password
                when you create an account.
              </li>
              <li>
                <strong>Profile Information:</strong> Job title, department, and other professional
                details you choose to provide.
              </li>
              <li>
                <strong>System Data:</strong> Information about your systems, infrastructure, and
                compliance configurations that you upload to our platform.
              </li>
              <li>
                <strong>Communications:</strong> Information you provide when contacting support or
                communicating with us.
              </li>
            </ul>

            <h3>Information Collected Automatically</h3>
            <p>When you use Cindral, we automatically collect:</p>
            <ul>
              <li>
                <strong>Usage Data:</strong> Information about how you interact with our platform,
                including features used and actions taken.
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating system, and device
                identifiers.
              </li>
              <li>
                <strong>Log Data:</strong> IP address, access times, and pages viewed.
              </li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our platform</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and security alerts</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Communicate about products, services, and events</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
              <li>Personalize and improve your experience</li>
            </ul>

            <h2>Data Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li>
                <strong>Service Providers:</strong> With third-party vendors who perform services on
                our behalf.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to respond to legal
                process.
              </li>
              <li>
                <strong>Protection:</strong> To protect the rights, privacy, safety, or property of
                Cindral, you, or others.
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger, acquisition, or
                sale of assets.
              </li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>

            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your
              information, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Access controls and authentication measures</li>
              <li>Employee training on data protection</li>
              <li>SOC 2 Type II compliance</li>
            </ul>

            <h2>Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to
              provide services. We also retain information as necessary to comply with legal
              obligations, resolve disputes, and enforce agreements.
            </p>

            <h2>Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@trycindral.com">privacy@trycindral.com</a>.
            </p>

            <h2>International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your
              own. We ensure appropriate safeguards are in place for such transfers, including
              Standard Contractual Clauses where required.
            </p>

            <h2>Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to collect information about your browsing
              activities. You can manage cookie preferences through your browser settings.
            </p>

            <h2>Children&apos;s Privacy</h2>
            <p>
              Cindral is not intended for children under 16. We do not knowingly collect
              information from children under 16.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>

            <h2>Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at:</p>
            <ul>
              <li>
                Email: <a href="mailto:privacy@trycindral.com">privacy@trycindral.com</a>
              </li>
              <li>Address: Cindral Ltd, London, United Kingdom</li>
            </ul>
          </div>
        </Container>
      </Section>
    </>
  )
}
