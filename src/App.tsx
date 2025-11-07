import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Download, Loader2, RefreshCw } from 'lucide-react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { ConfigSection } from './components/ConfigSection'
import { SprintInfo } from './components/SprintInfo'
import { UserBreakdown } from './components/UserBreakdown'
import { SummaryTable } from './components/SummaryTable'
import { AppHeader } from './components/AppHeader'
import { jiraService } from './services/jiraService'
import type { SprintData, JiraSprint } from './types'

function App() {
  const [config, setConfig] = useLocalStorage('jira-config', {
    jiraDomain: 'https://jetsgpt.atlassian.net',
    email: '',
    apiToken: '',
    boardId: 1,
    projectKey: 'RoomSense',
    hoursPerSP: 1,
  })

  const [sprintData, setSprintData] = useLocalStorage<SprintData | null>('sprint-data', null)
  const [availableSprints, setAvailableSprints] = useState<JiraSprint[]>([])
  const [selectedSprintId, setSelectedSprintId] = useLocalStorage<number | null>('selected-sprint-id', null)
  const [loadingSprints, setLoadingSprints] = useState(false)
  const [loadingSprintData, setLoadingSprintData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previousConfig = useRef({ boardId: config.boardId, jiraDomain: config.jiraDomain })

  useEffect(() => {
    const prev = previousConfig.current

    if (prev.boardId !== config.boardId || prev.jiraDomain !== config.jiraDomain) {
      setAvailableSprints([])
      setSelectedSprintId(null)
      setSprintData(null)
    }

    previousConfig.current = { boardId: config.boardId, jiraDomain: config.jiraDomain }
  }, [config.boardId, config.jiraDomain])

  const loadAvailableSprints = async () => {
    if (!config.jiraDomain || !config.email || !config.apiToken) {
      setError('Please fill in all required fields')
      return
    }

    setLoadingSprints(true)
    setError(null)
    setAvailableSprints([])

    try {
      const sprints = await jiraService.fetchBoardSprints(config)
      setAvailableSprints(sprints)

      if (sprints.length === 0) {
        setSelectedSprintId(null)
        setError('No sprints found for this board')
        return
      }

      const preferredSprint =
        (selectedSprintId && sprints.find(sprint => sprint.id === selectedSprintId)) ||
        sprints.find(sprint => sprint.state?.toLowerCase() === 'active') ||
        sprints[0]

      setSelectedSprintId(preferredSprint.id)
    } catch (err: any) {
      setError(err.message || 'Failed to load sprints')
      console.error('Error loading sprints:', err)
    } finally {
      setLoadingSprints(false)
    }
  }

  const loadSprintData = async () => {
    if (!config.jiraDomain || !config.email || !config.apiToken) {
      setError('Please fill in all required fields')
      return
    }

    if (!selectedSprintId) {
      setError('Please select a sprint to load')
      return
    }

    setLoadingSprintData(true)
    setError(null)

    try {
      const data = await jiraService.fetchSprintData(config, selectedSprintId)
      setSprintData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load Jira data')
      console.error('Error loading Jira data:', err)
    } finally {
      setLoadingSprintData(false)
    }
  }

  const handleSprintChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    if (!value) {
      setSelectedSprintId(null)
      return
    }

    const sprintId = Number(value)
    if (!Number.isNaN(sprintId)) {
      setSelectedSprintId(sprintId)
    }
  }

  const getSprintLabel = (sprint: JiraSprint) => {
    const start = sprint.startDate ? new Date(sprint.startDate) : null
    const end = sprint.endDate ? new Date(sprint.endDate) : null
    const dateFormatter = Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
    const startText = start ? dateFormatter.format(start) : null
    const endText = end ? dateFormatter.format(end) : null
    const dateRange = startText && endText ? `${startText} - ${endText}` : startText ?? endText ?? ''
    const stateText = sprint.state ? sprint.state.charAt(0).toUpperCase() + sprint.state.slice(1).toLowerCase() : ''
    const metaParts = [stateText, dateRange].filter(Boolean)
    return metaParts.length > 0 ? `${sprint.name} (${metaParts.join(' | ')})` : sprint.name
  }

  const updateSprintData = (updates: Partial<SprintData>) => {
    if (sprintData) {
      // Ensure headers exist when updating
      const updatedData = {
        ...sprintData,
        ...updates,
        headers: updates.headers || sprintData.headers || {
          ticketTable: {
            ticket: 'Ticket',
            summary: 'Summary',
            storyPoints: 'Story Points',
            hoursLogged: 'Hours Logged',
            difference: 'Difference',
            comments: 'Comments',
          },
          summaryTable: {
            user: 'User',
            storyPointsOwn: 'Story Points (Own)',
            hoursLoggedAll: 'Hours Logged (All)',
            plannedHours: 'Planned Hours',
            utilization: 'Utilization %',
          },
        },
      }
      setSprintData(updatedData)
    }
  }

  const exportToCSV = () => {
    if (!sprintData) return

    const headers = sprintData.headers || {
      ticketTable: {
        ticket: 'Ticket',
        summary: 'Summary',
        storyPoints: 'Story Points',
        hoursLogged: 'Hours Logged',
        difference: 'Difference',
        comments: 'Comments',
      },
      summaryTable: {
        user: 'User',
        storyPointsOwn: 'Story Points (Own)',
        hoursLoggedAll: 'Hours Logged (All)',
        plannedHours: 'Planned Hours',
        utilization: 'Utilization %',
      },
    }

    let csv = 'Sprint Report\n\n'
    
    for (const [user, tickets] of Object.entries(sprintData.userData)) {
      csv += `${user}\n`
      csv += `${headers.ticketTable.ticket},${headers.ticketTable.summary},${headers.ticketTable.storyPoints},${headers.ticketTable.hoursLogged},${headers.ticketTable.difference},${headers.ticketTable.comments}\n`
      tickets.forEach(t => {
        csv += `"${t['Ticket Display']}","${t.Summary}",${t['Story Points']},${t['Hours Logged (fmt)']},${t['Difference (fmt)']},"${t.Comments.replace(/"/g, '""')}"\n`
      })
      csv += `Total for ${user},,${sprintData.userSummaries[user]['Own Story Points']},${sprintData.userSummaries[user]['Total Hours (fmt)']},,\n\n`
    }

    csv += '\nSprint Summary\n'
    csv += `${headers.summaryTable.user},${headers.summaryTable.storyPointsOwn},${headers.summaryTable.hoursLoggedAll},${headers.summaryTable.plannedHours},${headers.summaryTable.utilization}\n`
    for (const [user, summary] of Object.entries(sprintData.userSummaries)) {
      const plannedHours = summary['Own Story Points'] * config.hoursPerSP
      const utilization = plannedHours > 0 ? (summary['Total Hours'] / plannedHours * 100) : 0
      csv += `${user},${summary['Own Story Points']},${summary['Total Hours (fmt)']},${plannedHours.toFixed(1)}h,${utilization.toFixed(1)}%\n`
    }
    const overallUtilization = sprintData.totals['All Story Points'] > 0 
      ? (sprintData.totals['All Hours'] / (sprintData.totals['All Story Points'] * config.hoursPerSP) * 100) 
      : 0
    csv += `TOTAL,${sprintData.totals['All Story Points']},${sprintData.totals['All Hours (fmt)']},${(sprintData.totals['All Story Points'] * config.hoursPerSP).toFixed(1)}h,${overallUtilization.toFixed(1)}%\n`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `RoomSense_Sprint_Report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen relative bg-[#ECF3E6] p-4 md:p-8 overflow-hidden">
      {/* Single decorative background item */}
      <div 
        className="fixed opacity-20 pointer-events-none z-0 animate-pulse-glow"
        style={{
          backgroundImage: 'url(/item.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          width: '400px',
          height: '400px',
          top: '10%',
          right: '5%',
        }}
      ></div>
      
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        <AppHeader />
        
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm animate-fade-in animate-delay-100 hover-lift transition-smooth">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-4xl font-heading text-[#455453]">
              Sprint Report Generator
            </CardTitle>
            <CardDescription className="text-lg mt-2 text-[#455453]/70">
              Generate and edit detailed sprint reports from Jira
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="animate-slide-in-left animate-delay-200">
              <ConfigSection config={config} setConfig={setConfig} />
            </div>

            <div className="flex flex-col gap-4 items-center justify-center animate-slide-in-right animate-delay-300 md:flex-row">
              <Button
                onClick={loadAvailableSprints}
                disabled={loadingSprints || loadingSprintData}
                size="lg"
                className="bg-[#79BC9E] hover:bg-[#6aa88a] text-white font-heading transition-smooth hover-lift"
              >
                {loadingSprints ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Sprints...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Fetch Sprints
                  </>
                )}
              </Button>

              <div className="flex flex-col items-center gap-2 md:flex-row">
                <Label htmlFor="sprint-select" className="text-[#455453] font-medium">
                  Sprint
                </Label>
                <select
                  id="sprint-select"
                  className="min-w-[220px] rounded-md border border-[#A4C6B0] bg-white px-3 py-2 text-[#455453] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#79BC9E] disabled:cursor-not-allowed disabled:opacity-60"
                  value={selectedSprintId !== null ? String(selectedSprintId) : ''}
                  onChange={handleSprintChange}
                  disabled={availableSprints.length === 0 || loadingSprints}
                >
                  <option value="" disabled>
                    {loadingSprints ? 'Loading...' : 'Select sprint'}
                  </option>
                  {availableSprints.map(sprint => (
                    <option key={sprint.id} value={String(sprint.id)}>
                      {getSprintLabel(sprint)}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={loadSprintData}
                disabled={loadingSprintData || !selectedSprintId}
                size="lg"
                className="bg-[#79BC9E] hover:bg-[#6aa88a] text-white font-heading transition-smooth hover-lift disabled:opacity-60"
              >
                {loadingSprintData ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Load Sprint Data
                  </>
                )}
              </Button>
            </div>

            {error && (
              <Card className="border-destructive bg-destructive/10 animate-fade-in">
                <CardContent className="pt-6">
                  <p className="text-destructive font-medium">{error}</p>
                </CardContent>
              </Card>
            )}

            {sprintData && (
              <>
                <div className="animate-fade-in animate-delay-400">
                  <SprintInfo
                    sprintData={sprintData}
                    updateSprintData={updateSprintData}
                  />
                </div>

                <div className="space-y-6">
                  {Object.entries(sprintData.userData).map(([user, tickets], index) => {
                    const userSummary = sprintData.userSummaries[user]
                    const userId = userSummary?.userId || `user-${index}`
                    return (
                      <div 
                        key={userId}
                        className="animate-fade-in"
                        style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                      >
                        <UserBreakdown
                          user={user}
                          tickets={tickets}
                          userSummary={userSummary}
                          hoursPerSP={config.hoursPerSP}
                          sprintData={sprintData}
                          updateSprintData={updateSprintData}
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="animate-fade-in animate-delay-300">
                  <SummaryTable
                    userSummaries={sprintData.userSummaries}
                    totals={sprintData.totals}
                    hoursPerSP={config.hoursPerSP}
                    sprintData={sprintData}
                    updateSprintData={updateSprintData}
                  />
                </div>

                <div className="flex justify-center pt-4 animate-fade-in animate-delay-400">
                  <Button 
                    onClick={exportToCSV} 
                    variant="outline" 
                    size="lg" 
                    className="border-[#A4C6B0] text-[#455453] hover:bg-[#CEEACE] font-heading transition-smooth hover-lift"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App

