import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ConfigSectionProps {
  config: {
    jiraDomain: string
    email: string
    apiToken: string
    boardId: number
    projectKey: string
    hoursPerSP: number
  }
  setConfig: (config: any) => void
}

export function ConfigSection({ config, setConfig }: ConfigSectionProps) {
  const updateConfig = (key: string, value: any) => {
    setConfig({ ...config, [key]: value })
  }

  return (
    <Card className="hover-lift transition-smooth">
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>Enter your Jira credentials and settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jiraDomain">Jira Domain</Label>
            <Input
              id="jiraDomain"
              value={config.jiraDomain}
              onChange={(e) => updateConfig('jiraDomain', e.target.value)}
              placeholder="https://jetsgpt.atlassian.net"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={config.email}
              onChange={(e) => updateConfig('email', e.target.value)}
              placeholder="your-email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiToken">API Token</Label>
            <Input
              id="apiToken"
              type="password"
              value={config.apiToken}
              onChange={(e) => updateConfig('apiToken', e.target.value)}
              placeholder="Enter your API token"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="boardId">Board ID</Label>
            <Input
              id="boardId"
              type="number"
              value={config.boardId}
              onChange={(e) => updateConfig('boardId', parseInt(e.target.value) || 1)}
              placeholder="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectKey">Project Key</Label>
            <Input
              id="projectKey"
              value={config.projectKey}
              onChange={(e) => updateConfig('projectKey', e.target.value)}
              placeholder="RoomSense"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hoursPerSP">Hours per Story Point</Label>
            <Input
              id="hoursPerSP"
              type="number"
              step="0.1"
              value={config.hoursPerSP}
              onChange={(e) => updateConfig('hoursPerSP', parseFloat(e.target.value) || 1)}
              placeholder="1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

