import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { EditableCell } from './EditableCell'
import type { SprintData } from '../types'

interface SprintInfoProps {
  sprintData: SprintData
  updateSprintData: (updates: Partial<SprintData>) => void
}

export function SprintInfo({ sprintData, updateSprintData }: SprintInfoProps) {
  const updateField = (field: string, value: string) => {
    updateSprintData({ [field]: value } as any)
  }

  const isClosed = sprintData.sprintState?.toLowerCase() === 'closed'

  return (
    <Card className={`transition-smooth hover-lift ${isClosed ? 'bg-[#FFF2CC] border-[#FFD966]' : 'bg-[#CEEACE] border-[#A4C6B0]'}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            {isClosed && (
              <div className="mb-2 text-sm font-semibold text-[#856404] bg-[#FFF2CC] px-3 py-1 rounded inline-block font-heading">
                ⚠️ Using closed sprint (no active sprint found)
              </div>
            )}
            <h2 className="text-2xl font-heading text-[#455453] mb-2">
              <EditableCell
                value={sprintData.sprintName}
                onSave={(val) => updateField('sprintName', String(val))}
                className="text-2xl font-heading"
              />
            </h2>
            <div className="text-sm text-[#455453]/70">
              Sprint window:{' '}
              <EditableCell
                value={sprintData.sprintStart}
                onSave={(val) => updateField('sprintStart', String(val))}
                className="inline"
              />
              {' → '}
              <EditableCell
                value={sprintData.sprintEnd}
                onSave={(val) => updateField('sprintEnd', String(val))}
                className="inline"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

