import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface TerritoryBadgesProps {
  territories: string[]
  maxVisible?: number
}

export const TerritoryBadges: React.FC<TerritoryBadgesProps> = ({
  territories,
  maxVisible = 10
}) => {
  const [showAll, setShowAll] = useState(false)

  if (!territories || territories.length === 0) {
    return <span className="text-gray-500">No territories selected</span>
  }

  const displayTerritories = showAll ? territories : territories.slice(0, maxVisible)
  const hasMore = territories.length > maxVisible

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {displayTerritories.map((territory) => (
          <span
            key={territory}
            className="px-3 py-1 text-sm bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full"
          >
            {territory}
          </span>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {territories.length - maxVisible} more
            </>
          )}
        </button>
      )}
    </div>
  )
}
