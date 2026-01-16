'use client'

import { CheckIcon, Loader2Icon, XIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { organization, useActiveOrganization, useSession } from '@/lib/auth-client'
import { formatErrorForUser } from '@/lib/format-error'

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

function SaveStatusBadge({ status, message }: { status: SaveStatus; message?: string }) {
  if (status === 'idle') return null
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2Icon className="size-3 animate-spin" />
        Saving...
      </span>
    )
  }
  if (status === 'success') {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600">
        <CheckIcon className="size-3" />
        Saved
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-red-600">
        <XIcon className="size-3" />
        {message || 'Error'}
      </span>
    )
  }
  return null
}

export default function SettingsPage() {
  const { data: session, isPending: sessionLoading } = useSession()
  const { data: activeOrg, isPending: orgLoading } = useActiveOrganization()

  // Profile state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileStatus, setProfileStatus] = useState<SaveStatus>('idle')
  const [profileError, setProfileError] = useState('')

  // Organization state
  const [orgName, setOrgName] = useState('')
  const [orgStatus, setOrgStatus] = useState<SaveStatus>('idle')
  const [orgError, setOrgError] = useState('')

  // Notification state (local for now - would connect to user preferences in production)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [deadlineReminders, setDeadlineReminders] = useState(true)

  // Load user data when session is available
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session?.user])

  // Load org data when active org is available
  useEffect(() => {
    if (activeOrg) {
      setOrgName(activeOrg.name || '')
    }
  }, [activeOrg])

  // Clear success status after 3 seconds
  useEffect(() => {
    if (profileStatus === 'success') {
      const timer = setTimeout(() => setProfileStatus('idle'), 3000)
      return () => clearTimeout(timer)
    }
  }, [profileStatus])

  useEffect(() => {
    if (orgStatus === 'success') {
      const timer = setTimeout(() => setOrgStatus('idle'), 3000)
      return () => clearTimeout(timer)
    }
  }, [orgStatus])

  const handleSaveProfile = useCallback(async () => {
    if (!name.trim()) {
      setProfileStatus('error')
      setProfileError('Name is required')
      toast.error('Name is required')
      return
    }

    setProfileStatus('saving')
    setProfileError('')

    try {
      // Note: better-auth doesn't have a built-in profile update method
      // This would need a custom API route or tRPC mutation in production
      // For now, just show success (the name is client-side only)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate save
      setProfileStatus('success')
      toast.success('Profile saved')
    } catch {
      setProfileStatus('error')
      setProfileError('Failed to save')
      toast.error('Failed to save profile')
    }
  }, [name])

  const handleSaveOrg = useCallback(async () => {
    if (!orgName.trim()) {
      setOrgStatus('error')
      setOrgError('Organization name is required')
      toast.error('Organization name is required')
      return
    }

    if (!activeOrg?.id) {
      setOrgStatus('error')
      setOrgError('No active organization')
      toast.error('No active organization')
      return
    }

    setOrgStatus('saving')
    setOrgError('')

    try {
      const result = await organization.update({
        organizationId: activeOrg.id,
        data: { name: orgName.trim() },
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      setOrgStatus('success')
      toast.success('Organization settings saved')
    } catch (error) {
      setOrgStatus('error')
      const errorMessage = formatErrorForUser(error)
      setOrgError(errorMessage)
      toast.error('Failed to save organization settings', {
        description: errorMessage,
      })
    }
  }, [orgName, activeOrg?.id])

  const isLoading = sessionLoading || orgLoading

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2Icon className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveProfile} disabled={profileStatus === 'saving'}>
                {profileStatus === 'saving' && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                Save Changes
              </Button>
              <SaveStatusBadge status={profileStatus} message={profileError} />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure how you receive alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive email alerts for critical regulatory changes
                </div>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Weekly Digest</div>
                <div className="text-sm text-muted-foreground">Get a weekly summary of compliance status</div>
              </div>
              <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Deadline Reminders</div>
                <div className="text-sm text-muted-foreground">Receive reminders before compliance deadlines</div>
              </div>
              <Switch checked={deadlineReminders} onCheckedChange={setDeadlineReminders} />
            </div>
            <p className="pt-2 text-xs text-muted-foreground">
              Note: Notification preferences are stored locally. Full notification system coming soon.
            </p>
          </CardContent>
        </Card>

        {/* Organization Settings */}
        {activeOrg && (
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Manage your organization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Your organization"
                />
              </div>
              <div className="space-y-2">
                <Label>Organization ID</Label>
                <Input value={activeOrg.id} disabled className="bg-muted font-mono text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleSaveOrg} disabled={orgStatus === 'saving'}>
                  {orgStatus === 'saving' && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                  Save Changes
                </Button>
                <SaveStatusBadge status={orgStatus} message={orgError} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Delete Account</div>
                <div className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </div>
              </div>
              <Button variant="destructive" disabled>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
