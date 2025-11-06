import { formatHours, parseDate, formatDate } from '../utils/formatHours'
import type { SprintData } from '../types'

export interface Config {
  jiraDomain: string
  email: string
  apiToken: string
  boardId: number
  projectKey: string
  hoursPerSP: number
}

function getAuthHeader(email: string, apiToken: string): string {
  const credentials = btoa(`${email}:${apiToken}`)
  return `Basic ${credentials}`
}

async function jiraRequest(url: string, email: string, apiToken: string): Promise<any> {
  const useProxy = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  if (useProxy) {
    try {
      const response = await fetch('/api/jira-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, email, apiToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Proxy error: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.warn('Proxy request failed, trying direct:', error)
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: getAuthHeader(email, apiToken),
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Jira API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

async function getActiveSprint(boardId: number, jiraDomain: string, email: string, apiToken: string) {
  const url = `${jiraDomain}/rest/agile/1.0/board/${boardId}/sprint`
  const data = await jiraRequest(url, email, apiToken)
  
  // First, try to find an active sprint
  const activeSprint = data.values.find((s: any) => s.state.toLowerCase() === 'active')
  if (activeSprint) {
    return activeSprint
  }
  
  // If no active sprint, find the most recently closed sprint
  const closedSprints = data.values
    .filter((s: any) => s.state.toLowerCase() === 'closed')
    .sort((a: any, b: any) => {
      // Sort by end date, most recent first
      const dateA = b.endDate ? new Date(b.endDate).getTime() : 0
      const dateB = a.endDate ? new Date(a.endDate).getTime() : 0
      return dateA - dateB
    })
  
  if (closedSprints.length > 0) {
    return closedSprints[0]
  }
  
  throw new Error('❌ No active or closed sprints found for this board.')
}

async function getIssuesForSprint(sprintId: number, jiraDomain: string, email: string, apiToken: string) {
  const url = `${jiraDomain}/rest/agile/1.0/sprint/${sprintId}/issue?maxResults=1000`
  const data = await jiraRequest(url, email, apiToken)
  return data.issues || []
}

async function getWorklogs(
  issueKey: string,
  jiraDomain: string,
  email: string,
  apiToken: string,
  sprintStart: string,
  sprintEnd: string
) {
  try {
    const url = `${jiraDomain}/rest/api/3/issue/${issueKey}/worklog`
    const data = await jiraRequest(url, email, apiToken)
    
    const users: Record<string, number> = {}
    const sprintStartDate = parseDate(sprintStart)
    const sprintEndDate = parseDate(sprintEnd)
    
    if (data.worklogs) {
      data.worklogs.forEach((log: any) => {
        const logDate = parseDate(log.started)
        if (logDate >= sprintStartDate && logDate <= sprintEndDate) {
          const user = log.author.displayName
          const hours = log.timeSpentSeconds / 3600
          users[user] = (users[user] || 0) + hours
        }
      })
    }
    
    return users
  } catch (error) {
    console.warn(`Could not fetch worklogs for ${issueKey}:`, error)
    return {}
  }
}

async function getIssueComments(issueKey: string, jiraDomain: string, email: string, apiToken: string) {
  try {
    const url = `${jiraDomain}/rest/api/3/issue/${issueKey}/comment`
    const data = await jiraRequest(url, email, apiToken)
    
    if (!data.comments || data.comments.length === 0) {
      return '-'
    }
    
    return data.comments
      .map((c: any) => {
        const author = c.author.displayName
        const date = formatDate(parseDate(c.created))
        
        // Handle comment body - it might be a string or an object (ADF format)
        let body = ''
        if (typeof c.body === 'string') {
          body = c.body.replace(/\r/g, ' ').replace(/\n/g, ' ').trim()
        } else if (c.body && typeof c.body === 'object') {
          // If it's ADF (Atlassian Document Format), try to extract text
          if (c.body.content && Array.isArray(c.body.content)) {
            const extractText = (node: any): string => {
              if (typeof node === 'string') return node
              if (node.text) return node.text
              if (node.content && Array.isArray(node.content)) {
                return node.content.map(extractText).join(' ')
              }
              return ''
            }
            body = extractText(c.body).trim()
          } else {
            body = JSON.stringify(c.body).substring(0, 100) // Fallback: show first 100 chars of JSON
          }
        }
        
        return `[${author}] (${date}): ${body}`
      })
      .join(' || ')
  } catch (error) {
    console.warn(`Could not fetch comments for ${issueKey}:`, error)
    return '-'
  }
}

function getStoryPoints(issue: any): number {
  const customFields = issue.fields
  
  // Try common story point custom field IDs
  const possibleFields = [
    customFields.customfield_10016,
    customFields.customfield_10020,
    customFields['customfield_10016'],
    // Also check for fields that might be named differently
    customFields.storyPoints,
    customFields['Story Points'],
  ]
  
  for (const field of possibleFields) {
    if (field === null || field === undefined) continue
    
    // If it's a number, return it
    if (typeof field === 'number') {
      return field
    }
    
    // If it's a string that can be parsed as a number
    if (typeof field === 'string') {
      const parsed = parseFloat(field)
      if (!isNaN(parsed)) {
        return parsed
      }
    }
    
    // If it's an object/array, skip it (don't return sprints array)
    if (typeof field === 'object') {
      continue
    }
  }
  
  return 0
}

export async function fetchSprintData(config: Config): Promise<SprintData> {
  const sprint = await getActiveSprint(config.boardId, config.jiraDomain, config.email, config.apiToken)
  const issues = await getIssuesForSprint(sprint.id, config.jiraDomain, config.email, config.apiToken)
  
  const userData: Record<string, any[]> = {}
  const userSummaries: Record<string, any> = {}
  let totalStoryPoints = 0
  let totalHours = 0

  for (const issue of issues) {
    const key = issue.key
    const summary = issue.fields.summary || 'No summary'
    const storyPointsRaw = getStoryPoints(issue)
    // Ensure story points is always a number
    const storyPoints = typeof storyPointsRaw === 'number' ? storyPointsRaw : (parseFloat(String(storyPointsRaw)) || 0)
    const plannedHours = parseFloat(String(storyPoints)) * config.hoursPerSP
    const assignee = issue.fields.assignee?.displayName || 'Unassigned'

    const worklogs = await getWorklogs(key, config.jiraDomain, config.email, config.apiToken, sprint.startDate, sprint.endDate)
    const comments = await getIssueComments(key, config.jiraDomain, config.email, config.apiToken)

    for (const [worker, hoursLogged] of Object.entries(worklogs)) {
      if (!userData[worker]) {
        userData[worker] = []
        userSummaries[worker] = {
          'Own Story Points': 0,
          'Total Hours': 0,
        }
      }

      const diff = plannedHours - hoursLogged
      const ticketDisplay = worker === assignee ? key : `${key} (${assignee})`

      userData[worker].push({
        Ticket: key,
        'Ticket Display': ticketDisplay,
        Summary: summary,
        'Story Points': storyPoints,
        'Hours Logged': hoursLogged,
        'Hours Logged (fmt)': formatHours(hoursLogged),
        Difference: diff,
        'Difference (fmt)': diff !== 0 ? formatHours(Math.abs(diff)) : '-',
        WorkedButNotOwner: worker !== assignee,
        Comments: comments,
      })

      userSummaries[worker]['Total Hours'] += hoursLogged

      if (worker === assignee) {
        userSummaries[worker]['Own Story Points'] += storyPoints
        totalStoryPoints += storyPoints
      }

      totalHours += hoursLogged
    }
  }

  for (const user in userSummaries) {
    userSummaries[user]['Total Hours (fmt)'] = formatHours(userSummaries[user]['Total Hours'])
    // Add stable userId if not present
    if (!userSummaries[user].userId) {
      userSummaries[user].userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  const totals = {
    'All Story Points': totalStoryPoints,
    'All Hours': totalHours,
    'All Hours (fmt)': formatHours(totalHours),
  }

  return {
    sprintName: sprint.name || 'Unnamed Sprint',
    sprintStart: sprint.startDate ? String(sprint.startDate) : '',
    sprintEnd: sprint.endDate ? String(sprint.endDate) : '',
    sprintState: sprint.state,
    userData,
    userSummaries,
    headers: {
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
    totals,
  }
}

export const jiraService = {
  fetchSprintData,
}

