import React from 'react'

interface Contributor {
  id: string
  name: string
  role: string
  instrument?: string
  description?: string
}

interface ContributorsListProps {
  contributors: Contributor[]
}

export const ContributorsList: React.FC<ContributorsListProps> = ({ contributors }) => {
  if (!contributors || contributors.length === 0) {
    return <span className="text-gray-500">No contributors</span>
  }

  // Group contributors by role
  const grouped = contributors.reduce((acc, contributor) => {
    const role = contributor.role || 'Other'
    if (!acc[role]) {
      acc[role] = []
    }
    acc[role].push(contributor)
    return acc
  }, {} as Record<string, Contributor[]>)

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([role, roleContributors]) => (
        <div key={role} className="flex gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400 min-w-[120px] capitalize">
            {role}:
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              {roleContributors.map((contributor) => (
                <span
                  key={contributor.id}
                  className="px-2 py-1 text-sm bg-gray-500/20 text-gray-300 rounded-md"
                >
                  {contributor.name}
                  {contributor.instrument && (
                    <span className="ml-1 text-xs text-gray-400">
                      ({contributor.instrument})
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
