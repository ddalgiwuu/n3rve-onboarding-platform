import React from 'react'

interface InfoGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3
}

export const InfoGrid: React.FC<InfoGridProps> = ({ children, columns = 2 }) => {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }[columns]

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {children}
    </div>
  )
}
