import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EditableCell } from './EditableCell'
import type { Ticket, UserSummary, SprintData } from '../types'
import { formatHours } from '../utils/formatHours'

interface UserBreakdownProps {
  user: string
  tickets: Ticket[]
  userSummary: UserSummary
  hoursPerSP: number
  sprintData: SprintData
  updateSprintData: (updates: Partial<SprintData>) => void
}

export function UserBreakdown({
  user,
  tickets,
  userSummary,
  hoursPerSP,
  sprintData,
  updateSprintData,
}: UserBreakdownProps) {
  const updateTicket = (ticketIndex: number, field: string, value: string | number) => {
    const updatedTickets = [...tickets]
    const ticket = updatedTickets[ticketIndex]
    
    if (field === 'Story Points') {
      ticket['Story Points'] = Number(value)
      const plannedHours = ticket['Story Points'] * hoursPerSP
      ticket.Difference = plannedHours - ticket['Hours Logged']
      ticket['Difference (fmt)'] = ticket.Difference !== 0 
        ? formatHours(Math.abs(ticket.Difference)) 
        : '-'
      
      // Update user summary
      const updatedSummaries = { ...sprintData.userSummaries }
      updatedSummaries[user] = {
        ...updatedSummaries[user],
        'Own Story Points': updatedTickets
          .filter(t => !t.WorkedButNotOwner)
          .reduce((sum, t) => sum + t['Story Points'], 0),
      }
      
      // Update totals
      const updatedTotals = {
        ...sprintData.totals,
        'All Story Points': Object.values(updatedSummaries)
          .reduce((sum, s) => sum + s['Own Story Points'], 0),
      }
      
      updateSprintData({
        userData: { ...sprintData.userData, [user]: updatedTickets },
        userSummaries: updatedSummaries,
        totals: updatedTotals,
      })
    } else if (field === 'Hours Logged') {
      ticket['Hours Logged'] = Number(value)
      ticket['Hours Logged (fmt)'] = formatHours(ticket['Hours Logged'])
      const plannedHours = ticket['Story Points'] * hoursPerSP
      ticket.Difference = plannedHours - ticket['Hours Logged']
      ticket['Difference (fmt)'] = ticket.Difference !== 0 
        ? formatHours(Math.abs(ticket.Difference)) 
        : '-'
      
      // Update user summary
      const updatedSummaries = { ...sprintData.userSummaries }
      const totalHours = updatedTickets.reduce((sum, t) => sum + t['Hours Logged'], 0)
      updatedSummaries[user] = {
        ...updatedSummaries[user],
        'Total Hours': totalHours,
        'Total Hours (fmt)': formatHours(totalHours),
      }
      
      // Update totals
      const updatedTotals = {
        ...sprintData.totals,
        'All Hours': Object.values(updatedSummaries)
          .reduce((sum, s) => sum + s['Total Hours'], 0),
        'All Hours (fmt)': formatHours(
          Object.values(updatedSummaries).reduce((sum, s) => sum + s['Total Hours'], 0)
        ),
      }
      
      updateSprintData({
        userData: { ...sprintData.userData, [user]: updatedTickets },
        userSummaries: updatedSummaries,
        totals: updatedTotals,
      })
    } else {
      (ticket as any)[field] = value
      updateSprintData({
        userData: { ...sprintData.userData, [user]: updatedTickets },
      })
    }
  }

  return (
    <Card className="hover-lift transition-smooth animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-[#79BC9E] to-[#A4C6B0] text-white rounded-t-lg transition-smooth">
        <CardTitle className="text-xl font-heading">
          <EditableCell
            value={user}
            onSave={(val) => {
              const newUser = String(val)
              if (newUser && newUser !== user) {
                const updatedData = { ...sprintData.userData }
                const updatedSummaries = { ...sprintData.userSummaries }
                
                // Preserve userId when renaming
                const userId = updatedSummaries[user]?.userId
                updatedData[newUser] = updatedData[user]
                updatedSummaries[newUser] = { ...updatedSummaries[user], userId }
                
                delete updatedData[user]
                delete updatedSummaries[user]
                
                updateSprintData({
                  userData: updatedData,
                  userSummaries: updatedSummaries,
                })
              }
            }}
            className="text-white text-xl font-semibold"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.ticketTable?.ticket || 'Ticket'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        ticketTable: {
                          ...sprintData.headers?.ticketTable,
                          ticket: String(val),
                        },
                      },
                    })
                  }}
                  className="font-semibold text-white hover:text-white hover:bg-white/20"
                />
              </TableHead>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.ticketTable?.summary || 'Summary'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        ticketTable: {
                          ...sprintData.headers?.ticketTable,
                          summary: String(val),
                        },
                      },
                    })
                  }}
                  className="font-semibold text-white hover:text-white hover:bg-white/20"
                />
              </TableHead>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.ticketTable?.status || 'Status'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        ticketTable: {
                          ...sprintData.headers?.ticketTable,
                          status: String(val),
                        },
                      },
                    })
                  }}
                  className="font-semibold text-white hover:text-white hover:bg-white/20"
                />
              </TableHead>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.ticketTable?.storyPoints || 'Story Points'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        ticketTable: {
                          ...sprintData.headers?.ticketTable,
                          storyPoints: String(val),
                        },
                      },
                    })
                  }}
                  className="font-semibold text-white hover:text-white hover:bg-white/20"
                />
              </TableHead>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.ticketTable?.hoursLogged || 'Hours Logged'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        ticketTable: {
                          ...sprintData.headers?.ticketTable,
                          hoursLogged: String(val),
                        },
                      },
                    })
                  }}
                  className="font-semibold text-white hover:text-white hover:bg-white/20"
                />
              </TableHead>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.ticketTable?.difference || 'Difference'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        ticketTable: {
                          ...sprintData.headers?.ticketTable,
                          difference: String(val),
                        },
                      },
                    })
                  }}
                  className="font-semibold text-white hover:text-white hover:bg-white/20"
                />
              </TableHead>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.ticketTable?.comments || 'Comments'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        ticketTable: {
                          ...sprintData.headers?.ticketTable,
                          comments: String(val),
                        },
                      },
                    })
                  }}
                  className="font-semibold text-white hover:text-white hover:bg-white/20"
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket, index) => (
              <TableRow
                key={index}
                className={`transition-smooth hover:bg-[#CEEACE]/30 ${ticket.WorkedButNotOwner ? 'bg-[#FFF2CC]/50' : ''}`}
              >
                <TableCell>
                  <EditableCell
                    value={ticket['Ticket Display']}
                    onSave={(val) => updateTicket(index, 'Ticket Display', String(val))}
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={ticket.Summary}
                    onSave={(val) => updateTicket(index, 'Summary', String(val))}
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={ticket.Status}
                    onSave={(val) => updateTicket(index, 'Status', String(val))}
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={ticket['Story Points']}
                    onSave={(val) => updateTicket(index, 'Story Points', Number(val))}
                    type="number"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={ticket['Hours Logged (fmt)']}
                    onSave={(val) => {
                      // Parse hours format (e.g., "2h 30m")
                      const str = String(val)
                      const hoursMatch = str.match(/(\d+)h/)
                      const minutesMatch = str.match(/(\d+)m/)
                      const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0
                      const minutes = minutesMatch ? parseFloat(minutesMatch[1]) : 0
                      const totalHours = hours + minutes / 60
                      updateTicket(index, 'Hours Logged', totalHours)
                    }}
                  />
                </TableCell>
                <TableCell
                  className={
                    ticket.Difference < 0
                      ? 'bg-[#FFC7CE] font-semibold'
                      : ticket.Difference > 0
                      ? 'bg-[#C6EFCE] font-semibold'
                      : ''
                  }
                >
                  {ticket['Difference (fmt)']}
                </TableCell>
                <TableCell className="max-w-md">
                  <EditableCell
                    value={ticket.Comments}
                    onSave={(val) => updateTicket(index, 'Comments', String(val))}
                    className="text-xs text-muted-foreground"
                  />
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={3}>
                <EditableCell
                  value={`Total for ${user}`}
                  onSave={(val) => {
                    const newText = String(val)
                    // Extract new user name if format is "Total for {name}"
                    const match = newText.match(/^Total for (.+)$/)
                    if (match) {
                      const newUser = match[1].trim()
                      if (newUser && newUser !== user) {
                        const updatedData = { ...sprintData.userData }
                        const updatedSummaries = { ...sprintData.userSummaries }
                        
                        // Preserve userId when renaming
                        const userId = updatedSummaries[user]?.userId
                        updatedData[newUser] = updatedData[user]
                        updatedSummaries[newUser] = { ...updatedSummaries[user], userId }
                        
                        delete updatedData[user]
                        delete updatedSummaries[user]
                        
                        updateSprintData({
                          userData: updatedData,
                          userSummaries: updatedSummaries,
                        })
                      }
                    }
                  }}
                  className="font-semibold"
                />
              </TableCell>
              <TableCell>
                <EditableCell
                  value={userSummary['Own Story Points']}
                  onSave={(val) => {
                    const updatedSummaries = { ...sprintData.userSummaries }
                    updatedSummaries[user] = {
                      ...updatedSummaries[user],
                      'Own Story Points': Number(val),
                    }
                    
                    const updatedTotals = {
                      ...sprintData.totals,
                      'All Story Points': Object.values(updatedSummaries)
                        .reduce((sum, s) => sum + s['Own Story Points'], 0),
                    }
                    
                    updateSprintData({
                      userSummaries: updatedSummaries,
                      totals: updatedTotals,
                    })
                  }}
                  type="number"
                />
              </TableCell>
              <TableCell>
                <EditableCell
                  value={userSummary['Total Hours (fmt)']}
                  onSave={(val) => {
                    const str = String(val)
                    const hoursMatch = str.match(/(\d+)h/)
                    const minutesMatch = str.match(/(\d+)m/)
                    const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0
                    const minutes = minutesMatch ? parseFloat(minutesMatch[1]) : 0
                    const totalHours = hours + minutes / 60
                    
                    const updatedSummaries = { ...sprintData.userSummaries }
                    updatedSummaries[user] = {
                      ...updatedSummaries[user],
                      'Total Hours': totalHours,
                      'Total Hours (fmt)': formatHours(totalHours),
                    }
                    
                    const updatedTotals = {
                      ...sprintData.totals,
                      'All Hours': Object.values(updatedSummaries)
                        .reduce((sum, s) => sum + s['Total Hours'], 0),
                      'All Hours (fmt)': formatHours(
                        Object.values(updatedSummaries).reduce((sum, s) => sum + s['Total Hours'], 0)
                      ),
                    }
                    
                    updateSprintData({
                      userSummaries: updatedSummaries,
                      totals: updatedTotals,
                    })
                  }}
                />
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

