import React from 'react'
import { Card } from '@/components/ui/card'

export function AppHeader() {
  return (
    <header className="w-full mb-6 animate-fade-in">
      <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-4">
          <div className="flex items-center gap-4">
            <img 
              src="/ROOMSENSE_logo.png" 
              alt="RoomSense Logo" 
              className="h-16 w-auto animate-scale-in"
            />
            <div>
              <h1 className="text-2xl font-heading text-[#455453]">Sprint Report Generator</h1>
              <p className="text-sm text-[#455453]/70">Track and analyze sprint performance</p>
            </div>
          </div>
          <div className="text-sm text-[#455453]/60 text-center md:text-right">
            <p className="font-medium">RoomSense Project Management</p>
            <p className="text-xs">Powered by Jira API</p>
          </div>
        </div>
      </Card>
    </header>
  )
}

