import { AuthDemo } from '@/components/auth-demo'
import { OrganizationDemo } from '@/components/organization-demo'

export default function AuthTestPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Better Auth & Organizations Demo</h1>
        <p className="mt-2 text-muted-foreground">Test authentication and organization management features</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AuthDemo />
        <OrganizationDemo />
      </div>

      <div className="rounded-lg border bg-muted/50 p-6">
        <h2 className="mb-4 text-xl font-semibold">Getting Started</h2>
        <ol className="space-y-2 text-sm">
          <li>
            <strong>1. Sign Up:</strong> Create a new account with email and password
          </li>
          <li>
            <strong>2. Create Organization:</strong> Once signed in, create your first organization
          </li>
          <li>
            <strong>3. Manage Organizations:</strong> Switch between organizations using &quot;Set Active&quot;
          </li>
          <li>
            <strong>4. Invite Members:</strong> Use the organization client methods to invite others
          </li>
        </ol>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Features Available</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium">Authentication</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ Email/Password sign up</li>
              <li>✓ Email/Password sign in</li>
              <li>✓ Session management</li>
              <li>✓ Secure cookies</li>
              <li>✓ Sign out</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-medium">Organizations</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ Create organizations</li>
              <li>✓ List memberships</li>
              <li>✓ Set active organization</li>
              <li>✓ Role-based access (owner, admin, member)</li>
              <li>✓ Member invitations</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-medium">tRPC Integration</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ Public procedures</li>
              <li>✓ Protected procedures (auth required)</li>
              <li>✓ Org procedures (org scope)</li>
              <li>✓ Type-safe queries</li>
              <li>✓ Session context</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-medium">Database</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ PostgreSQL with Drizzle</li>
              <li>✓ User tables</li>
              <li>✓ Organization tables</li>
              <li>✓ Relational queries</li>
              <li>✓ Type-safe schema</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
        <h2 className="mb-2 text-lg font-semibold">📚 Documentation</h2>
        <p className="text-sm text-muted-foreground">
          See <code className="rounded bg-muted px-1 py-0.5">.github/instructions/auth.instructions.md</code> for
          complete documentation on using better-auth in this project.
        </p>
      </div>
    </div>
  )
}
