import { formatHours, parseDate, formatDate } from '../utils/formatHours'
import type { SprintData, JiraSprint } from '../types'

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

const SPRINT_STATE_ORDER: Record<string, number> = {
  active: 0,
  future: 1,
  closed: 2,
}

function normalizeSprint(raw: any): JiraSprint {
  return {
    id: raw.id,
    name: raw.name,
    state: raw.state,
    startDate: raw.startDate,
    endDate: raw.endDate,
  }
}

async function getBoardSprints(
  boardId: number,
  jiraDomain: string,
  email: string,
  apiToken: string
): Promise<JiraSprint[]> {
  const sprints: JiraSprint[] = []
  const maxResults = 50
  let startAt = 0
  let isLast = false

  while (!isLast) {
    const url = `${jiraDomain}/rest/agile/1.0/board/${boardId}/sprint?startAt=${startAt}&maxResults=${maxResults}&state=active,future,closed`
    const data = await jiraRequest(url, email, apiToken)

    if (Array.isArray(data.values)) {
      sprints.push(...data.values.map(normalizeSprint))
      if (data.values.length < maxResults) {
        isLast = true
      }
    } else {
      isLast = true
    }

    if (data.isLast === true) {
      isLast = true
    }

    startAt += maxResults
  }

  return sprints.sort((a, b) => {
    const stateA = SPRINT_STATE_ORDER[a.state?.toLowerCase() || ''] ?? 99
    const stateB = SPRINT_STATE_ORDER[b.state?.toLowerCase() || ''] ?? 99
    if (stateA !== stateB) return stateA - stateB

    const dateA = a.startDate || a.endDate
    const dateB = b.startDate || b.endDate
    const timeA = dateA ? new Date(dateA).getTime() : 0
    const timeB = dateB ? new Date(dateB).getTime() : 0
    return timeB - timeA
  })
}

async function getActiveSprint(boardId: number, jiraDomain: string, email: string, apiToken: string) {
  const sprints = await getBoardSprints(boardId, jiraDomain, email, apiToken)

  const activeSprint = sprints.find(s => s.state?.toLowerCase() === 'active')
  if (activeSprint) {
    return activeSprint
  }

  const closedSprints = sprints
    .filter(s => s.state?.toLowerCase() === 'closed')
    .sort((a, b) => {
      const dateA = a.endDate ? new Date(a.endDate).getTime() : 0
      const dateB = b.endDate ? new Date(b.endDate).getTime() : 0
      return dateB - dateA
    })

  if (closedSprints.length > 0) {
    return closedSprints[0]
  }

  throw new Error('❌ No active or closed sprints found for this board.')
}

async function getSprintDetails(sprintId: number, jiraDomain: string, email: string, apiToken: string): Promise<JiraSprint> {
  const url = `${jiraDomain}/rest/agile/1.0/sprint/${sprintId}`
  const data = await jiraRequest(url, email, apiToken)
  return normalizeSprint(data)
}

async function getIssuesForSprint(sprintId: number, jiraDomain: string, email: string, apiToken: string) {
  // Fetch all issues from sprint - this should include subtasks by default
  // However, some board configurations might filter them out, so we'll also fetch subtasks explicitly
  const url = `${jiraDomain}/rest/agile/1.0/sprint/${sprintId}/issue?maxResults=1000`
  const data = await jiraRequest(url, email, apiToken)
  let issues = data.issues || []
  
  // Track which subtasks we already have
  const existingSubtaskKeys = new Set(
    issues
      .filter((issue: any) => issue.fields?.issuetype?.subtask === true)
      .map((issue: any) => issue.key)
  )
  
  // Get all parent issues and collect their subtask keys
  const parentIssues = issues.filter((issue: any) => issue.fields?.issuetype?.subtask !== true)
  const subtaskKeysToFetch: string[] = []
  
  // First pass: collect all subtask keys from parent issues
  for (const parentIssue of parentIssues) {
    try {
      const subtasksUrl = `${jiraDomain}/rest/api/3/issue/${parentIssue.key}?fields=subtasks`
      const parentData = await jiraRequest(subtasksUrl, email, apiToken)
      
      if (parentData.fields?.subtasks && Array.isArray(parentData.fields.subtasks)) {
        for (const subtask of parentData.fields.subtasks) {
          if (!existingSubtaskKeys.has(subtask.key) && !subtaskKeysToFetch.includes(subtask.key)) {
            subtaskKeysToFetch.push(subtask.key)
          }
        }
      }
    } catch (error) {
      console.warn(`Could not fetch subtasks for ${parentIssue.key}:`, error)
    }
  }
  
  // Second pass: fetch all missing subtasks
  // Use JQL search to fetch multiple subtasks at once (more efficient)
  if (subtaskKeysToFetch.length > 0) {
    try {
      // JQL query to fetch all subtasks at once
      const keysQuery = subtaskKeysToFetch.map(key => `key = ${key}`).join(' OR ')
      const searchUrl = `${jiraDomain}/rest/api/3/search?jql=${encodeURIComponent(keysQuery)}&maxResults=1000`
      const searchData = await jiraRequest(searchUrl, email, apiToken)
      
      if (searchData.issues && Array.isArray(searchData.issues)) {
        issues.push(...searchData.issues)
        console.log(`Fetched ${searchData.issues.length} additional subtasks`)
      }
    } catch (error) {
      console.warn('Could not batch fetch subtasks, falling back to individual requests:', error)
      // Fallback: fetch subtasks individually
      for (const subtaskKey of subtaskKeysToFetch) {
        try {
          const subtaskUrl = `${jiraDomain}/rest/api/3/issue/${subtaskKey}`
          const subtaskData = await jiraRequest(subtaskUrl, email, apiToken)
          issues.push(subtaskData)
        } catch (err) {
          console.warn(`Could not fetch subtask ${subtaskKey}:`, err)
        }
      }
    }
  }
  
  // Log for debugging
  const subtaskCount = issues.filter((issue: any) => issue.fields?.issuetype?.subtask === true).length
  if (subtaskCount > 0) {
    console.log(`Total subtasks found: ${subtaskCount}`)
  }
  
  return issues
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
    const inclusiveEnd = new Date(sprintEndDate.getTime())

    // If end date string does not include time information, treat it as end of day (23:59:59.999)
    if (!/T\d{2}:\d{2}/.test(sprintEnd)) {
      inclusiveEnd.setHours(23, 59, 59, 999)
    }
    
    if (data.worklogs) {
      data.worklogs.forEach((log: any) => {
        const logDate = parseDate(log.started)
        if (logDate >= sprintStartDate && logDate <= inclusiveEnd) {
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

export async function fetchSprintData(config: Config, sprintId?: number): Promise<SprintData> {
  let sprint = sprintId
    ? await getSprintDetails(sprintId, config.jiraDomain, config.email, config.apiToken)
    : await getActiveSprint(config.boardId, config.jiraDomain, config.email, config.apiToken)

  if (!sprint.startDate || !sprint.endDate) {
    const detailedSprint = await getSprintDetails(sprint.id, config.jiraDomain, config.email, config.apiToken)
    sprint = { ...sprint, ...detailedSprint }
  }

  if (!sprint.startDate || !sprint.endDate) {
    throw new Error(`Sprint ${sprint.name || sprint.id} is missing start or end date information`)
  }

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

    const worklogs = await getWorklogs(
      key,
      config.jiraDomain,
      config.email,
      config.apiToken,
      sprint.startDate,
      sprint.endDate
    )
    const comments = await getIssueComments(key, config.jiraDomain, config.email, config.apiToken)

    const workers = new Set(Object.keys(worklogs))
    // Ensure the assignee gets a row even with 0 hours
    if (assignee && assignee !== 'Unassigned') {
      workers.add(assignee)
    }

    for (const worker of workers) {
      const hoursLogged = worklogs[worker as keyof typeof worklogs] ?? 0

      if (!userData[worker]) {
        userData[worker] = []
        userSummaries[worker] = {
          'Own Story Points': 0,
          'Total Hours': 0,
        }
      }

      const diff = plannedHours - hoursLogged
      const ticketDisplay = worker === assignee
        ? key
        : `${key} (${assignee})`

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
    sprintId: sprint.id,
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

export async function fetchBoardSprints(config: Config): Promise<JiraSprint[]> {
  return getBoardSprints(config.boardId, config.jiraDomain, config.email, config.apiToken)
}

export const jiraService = {
  fetchSprintData,
  fetchBoardSprints,
}

