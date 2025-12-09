import React from 'react'

interface InfoItemProps {
  label: string
  value: React.ReactNode
  fullWidth?: boolean
}

export const InfoItem: React.FC<InfoItemProps> = ({ label, value, fullWidth = false }) => {
  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <dt className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </dt>
      <dd className="text-base font-medium text-gray-900 dark:text-white">
        {value || '-'}
      </dd>
    </div>
  )
}
