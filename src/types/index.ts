export interface Ticket {
  Ticket: string
  'Ticket Display': string
  Summary: string
  'Story Points': number
  'Hours Logged': number
  'Hours Logged (fmt)': string
  Difference: number
  'Difference (fmt)': string
  WorkedButNotOwner: boolean
  Comments: string
}

export interface UserSummary {
  'Own Story Points': number
  'Total Hours': number
  'Total Hours (fmt)': string
  userId?: string // Stable identifier for React keys
}

export interface TableHeaders {
  ticketTable: {
    ticket: string
    summary: string
    storyPoints: string
    hoursLogged: string
    difference: string
    comments: string
  }
  summaryTable: {
    user: string
    storyPointsOwn: string
    hoursLoggedAll: string
    plannedHours: string
    utilization: string
  }
}

export interface SprintData {
  sprintId?: number
  sprintName: string
  sprintStart: string
  sprintEnd: string
  sprintState?: string
  userData: Record<string, Ticket[]>
  userSummaries: Record<string, UserSummary>
  headers?: TableHeaders
  totals: {
    'All Story Points': number
    'All Hours': number
    'All Hours (fmt)': string
  }
}

export interface JiraSprint {
  id: number
  name: string
  state: string
  startDate?: string
  endDate?: string
}

