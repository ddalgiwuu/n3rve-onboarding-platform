import React from 'react'

interface Artist {
  id: string
  name: string
  spotifyId?: string
  appleMusicId?: string
}

interface ArtistBadgesProps {
  artists: Artist[]
  color?: 'purple' | 'blue' | 'pink' | 'green'
}

export const ArtistBadges: React.FC<ArtistBadgesProps> = ({ artists, color = 'purple' }) => {
  if (!artists || artists.length === 0) return <span className="text-gray-500">-</span>

  const colorClasses = {
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    green: 'bg-green-500/20 text-green-300 border-green-500/30'
  }

  return (
    <div className="flex flex-wrap gap-2">
      {artists.map((artist) => (
        <span
          key={artist.id}
          className={`px-3 py-1 rounded-full text-sm font-medium border ${colorClasses[color]}`}
        >
          {artist.name}
        </span>
      ))}
    </div>
  )
}
