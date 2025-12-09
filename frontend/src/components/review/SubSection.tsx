import React from 'react'

interface SubSectionProps {
  title: string
  children: React.ReactNode
}

export const SubSection: React.FC<SubSectionProps> = ({ title, children }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
        {title}
      </h4>
      {children}
    </div>
  )
}
