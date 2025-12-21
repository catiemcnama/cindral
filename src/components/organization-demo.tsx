'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { organization, useActiveOrganization } from '@/lib/auth-client'
import { useTRPC } from '@/trpc/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function OrganizationDemo() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: activeOrg, isPending: isLoadingActiveOrg } = useActiveOrganization()
  const { data: organizations, isLoading: isLoadingOrgs } = useQuery(trpc.getMyOrganizations.queryOptions())

  const [orgName, setOrgName] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const slug = orgName.toLowerCase().replace(/\s+/g, '-')
      await organization.create({
        name: orgName,
        slug,
      })
      setOrgName('')
      // Refetch organizations
      queryClient.invalidateQueries({ queryKey: trpc.getMyOrganizations.queryKey() })
    } catch (error) {
      console.error('Failed to create organization:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleSetActive = async (orgId: string) => {
    try {
      await organization.setActive({ organizationId: orgId })
      queryClient.invalidateQueries()
    } catch (error) {
      console.error('Failed to set active organization:', error)
    }
  }

  if (isLoadingOrgs || isLoadingActiveOrg) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
        <CardDescription>Manage your organizations and memberships</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Organization */}
        {activeOrg && (
          <div className="rounded-lg border border-primary bg-primary/5 p-4">
            <p className="text-sm font-medium">Active Organization</p>
            <p className="text-lg font-semibold">{activeOrg.name}</p>
            <p className="text-sm text-muted-foreground">Slug: {activeOrg.slug}</p>
          </div>
        )}

        {/* Organization List */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Your Organizations</p>
          {organizations && organizations.length > 0 ? (
            <div className="space-y-2">
              {organizations.map((org) => (
                <div key={org.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Role: {org.role} • {org.slug}
                    </p>
                  </div>
                  {activeOrg?.id !== org.id && (
                    <Button size="sm" variant="outline" onClick={() => handleSetActive(org.id)}>
                      Set Active
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No organizations yet</p>
          )}
        </div>

        {/* Create Organization Form */}
        <form onSubmit={handleCreateOrg} className="space-y-4 border-t xccapt-4">
          <p className="text-sm font-medium">Create New Organization</p>
          <Input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Organization Name"
            required
          />
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
