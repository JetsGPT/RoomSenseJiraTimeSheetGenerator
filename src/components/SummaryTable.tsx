import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { EditableCell } from './EditableCell'
import type { UserSummary, SprintData } from '../types'
import { formatHours } from '../utils/formatHours'

interface SummaryTableProps {
  userSummaries: Record<string, UserSummary>
  totals: {
    'All Story Points': number
    'All Hours': number
    'All Hours (fmt)': string
  }
  hoursPerSP: number
  sprintData: SprintData
  updateSprintData: (updates: Partial<SprintData>) => void
}

export function SummaryTable({
  userSummaries,
  totals,
  hoursPerSP,
  sprintData,
  updateSprintData,
}: SummaryTableProps) {
  const updateUserSummary = (user: string, field: string, value: number) => {
    const updatedSummaries = { ...sprintData.userSummaries }
    
    if (field === 'Own Story Points') {
      updatedSummaries[user] = {
        ...updatedSummaries[user],
        'Own Story Points': value,
      }
      
      // Update totals
      const updatedTotals = {
        ...totals,
        'All Story Points': Object.values(updatedSummaries)
          .reduce((sum, s) => sum + s['Own Story Points'], 0),
      }
      
      updateSprintData({
        userSummaries: updatedSummaries,
        totals: updatedTotals,
      })
    } else if (field === 'Total Hours') {
      updatedSummaries[user] = {
        ...updatedSummaries[user],
        'Total Hours': value,
        'Total Hours (fmt)': formatHours(value),
      }
      
      // Update totals
      const updatedTotals = {
        ...totals,
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
    }
  }

  return (
    <Card className="hover-lift transition-smooth animate-fade-in">
      <CardHeader>
        <CardTitle>Sprint Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.summaryTable?.user || 'User'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        summaryTable: {
                          ...sprintData.headers?.summaryTable,
                          user: String(val),
                        },
                      },
                    })
                  }}
                  className="font-semibold text-white hover:text-white hover:bg-white/20"
                />
              </TableHead>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.summaryTable?.storyPointsOwn || 'Story Points (Own)'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        summaryTable: {
                          ...sprintData.headers?.summaryTable,
                          storyPointsOwn: String(val),
                        },
                      },
                    })
                  }}
                  className="font-semibold text-white hover:text-white hover:bg-white/20"
                />
              </TableHead>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.summaryTable?.hoursLoggedAll || 'Hours Logged (All)'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        summaryTable: {
                          ...sprintData.headers?.summaryTable,
                          hoursLoggedAll: String(val),
                        },
                      },
                    })
                  }}
                  className="font-semibold text-white hover:text-white hover:bg-white/20"
                />
              </TableHead>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.summaryTable?.plannedHours || 'Planned Hours'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        summaryTable: {
                          ...sprintData.headers?.summaryTable,
                          plannedHours: String(val),
                        },
                      },
                    })
                  }}
                  className="font-semibold text-white hover:text-white hover:bg-white/20"
                />
              </TableHead>
              <TableHead>
                <EditableCell
                  value={sprintData.headers?.summaryTable?.utilization || 'Utilization %'}
                  onSave={(val) => {
                    updateSprintData({
                      headers: {
                        ...sprintData.headers,
                        summaryTable: {
                          ...sprintData.headers?.summaryTable,
                          utilization: String(val),
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
            {Object.entries(userSummaries).map(([user, summary]) => {
              const plannedHours = summary['Own Story Points'] * hoursPerSP
              const utilization = plannedHours > 0 
                ? (summary['Total Hours'] / plannedHours * 100) 
                : 0
              
              return (
                <TableRow key={user} className="transition-smooth hover:bg-[#CEEACE]/30">
                  <TableCell>
                    <EditableCell
                      value={user}
                      onSave={(val) => {
                        const newUser = String(val)
                        const updatedSummaries = { ...sprintData.userSummaries }
                        const updatedData = { ...sprintData.userData }
                        
                        updatedSummaries[newUser] = updatedSummaries[user]
                        updatedData[newUser] = updatedData[user]
                        
                        delete updatedSummaries[user]
                        delete updatedData[user]
                        
                        updateSprintData({
                          userSummaries: updatedSummaries,
                          userData: updatedData,
                        })
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={summary['Own Story Points']}
                      onSave={(val) => updateUserSummary(user, 'Own Story Points', Number(val))}
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={summary['Total Hours (fmt)']}
                      onSave={(val) => {
                        const str = String(val)
                        const hoursMatch = str.match(/(\d+)h/)
                        const minutesMatch = str.match(/(\d+)m/)
                        const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0
                        const minutes = minutesMatch ? parseFloat(minutesMatch[1]) : 0
                        const totalHours = hours + minutes / 60
                        updateUserSummary(user, 'Total Hours', totalHours)
                      }}
                    />
                  </TableCell>
                  <TableCell>{formatHours(plannedHours)}</TableCell>
                  <TableCell
                    className={
                      utilization > 110
                        ? 'bg-[#FFC7CE] font-semibold'
                        : utilization < 90
                        ? 'bg-[#C6EFCE] font-semibold'
                        : 'bg-[#CEEACE]'
                    }
                  >
                    {utilization.toFixed(1)}%
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">TOTAL</TableCell>
              <TableCell className="font-bold">{totals['All Story Points']}</TableCell>
              <TableCell className="font-bold">{totals['All Hours (fmt)']}</TableCell>
              <TableCell className="font-bold">
                {formatHours(totals['All Story Points'] * hoursPerSP)}
              </TableCell>
              <TableCell className="font-bold bg-[#A4C6B0]">
                {totals['All Story Points'] > 0
                  ? ((totals['All Hours'] / (totals['All Story Points'] * hoursPerSP)) * 100).toFixed(1)
                  : 0}%
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}

