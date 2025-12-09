import React, { useState } from 'react';
import { Edit2, Trash2, ExternalLink, Music, User } from 'lucide-react';

interface Contributor {
  id: string;
  name: string;
  roles: string[];
  spotifyId?: string;
  appleMusicId?: string;
}

interface ContributorCardProps {
  contributor: Contributor;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ContributorCard: React.FC<ContributorCardProps> = ({
  contributor,
  onEdit,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Extract Spotify artist ID from full URI
  const getSpotifyArtistId = (uri: string) => {
    return uri.split(':').pop();
  };

  // Generate Spotify and Apple Music links
  const spotifyLink = contributor.spotifyId
    ? `https://open.spotify.com/artist/${getSpotifyArtistId(contributor.spotifyId)}`
    : null;
  const appleMusicLink = contributor.appleMusicId
    ? `https://music.apple.com/artist/${contributor.appleMusicId}`
    : null;

  // Categorize roles (you can expand this logic)
  const getRoleIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('administrator') || roleLower.includes('manager')) {
      return <User className="w-3 h-3" />;
    }
    return <Music className="w-3 h-3" />;
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background blur effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-75 blur-xl transition duration-500" />
      
      {/* Main card */}
      <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:shadow-purple-500/20 hover:border-slate-600/50">
        
        {/* Header: Name + Actions */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            {/* Contributor Name */}
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-1 leading-tight">
              {contributor.name}
            </h3>
            
            {/* Subtitle indicator */}
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
              <span>Contributor</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(contributor.id)}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-600 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Edit contributor"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(contributor.id)}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Delete contributor"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Roles & Instruments */}
        {contributor.roles && contributor.roles.length > 0 && (
          <div className="mb-5">
            <div className="flex flex-wrap gap-2">
              {contributor.roles.map((role, index) => (
                <div
                  key={index}
                  className="group/badge relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-medium transition-all duration-300 hover:border-purple-400/50 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-purple-500/20 hover:scale-105"
                >
                  {/* Icon */}
                  <span className="text-purple-400 transition-transform duration-300 group-hover/badge:scale-110">
                    {getRoleIcon(role)}
                  </span>
                  
                  {/* Role text */}
                  <span className="relative">
                    {role}
                  </span>

                  {/* Subtle shimmer effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/badge:opacity-100 transition-opacity duration-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform IDs */}
        {(spotifyLink || appleMusicLink) && (
          <div className="space-y-2.5">
            {/* Section label */}
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Streaming Platforms
            </div>

            {/* Spotify */}
            {spotifyLink && (
              <a
                href={spotifyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-500/5 to-green-600/5 border border-green-500/20 hover:border-green-500/40 hover:from-green-500/10 hover:to-green-600/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  {/* Spotify logo */}
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/30 group-hover/link:bg-green-500/20 transition-colors duration-300">
                    <svg
                      className="w-5 h-5 text-green-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </div>

                  {/* Platform info */}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-green-400">
                      Spotify
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {getSpotifyArtistId(contributor.spotifyId || '')}
                    </span>
                  </div>
                </div>

                {/* External link icon */}
                <ExternalLink className="w-4 h-4 text-green-400/60 group-hover/link:text-green-400 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all duration-300" />
              </a>
            )}

            {/* Apple Music */}
            {appleMusicLink && (
              <a
                href={appleMusicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-pink-500/5 to-red-500/5 border border-pink-500/20 hover:border-pink-500/40 hover:from-pink-500/10 hover:to-red-500/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  {/* Apple Music logo */}
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500/10 to-red-500/10 border border-pink-500/30 group-hover/link:from-pink-500/20 group-hover/link:to-red-500/20 transition-colors duration-300">
                    <svg
                      className="w-5 h-5 text-pink-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043-1.118-.732-2.36-1.092-3.72-1.092-.973 0-1.91.21-2.79.63-.88.42-1.659 1.01-2.33 1.77-.671-.76-1.45-1.35-2.33-1.77-.88-.42-1.817-.63-2.79-.63-1.36 0-2.602.36-3.72 1.092-1.118.733-1.863 1.734-2.18 3.043-.175.72-.24 1.452-.24 2.19 0 .867.096 1.711.28 2.53.368 1.63 1.04 3.11 2.01 4.43 1.44 1.96 3.142 3.59 5.1 4.89l3.71 2.458c.396.264.862.396 1.328.396.466 0 .932-.132 1.328-.396l3.71-2.458c1.958-1.3 3.66-2.93 5.1-4.89.97-1.32 1.642-2.8 2.01-4.43.184-.819.28-1.663.28-2.53zm-6.423 3.99v5.712c0 .264-.11.514-.297.704-.187.19-.438.297-.704.297h-.022c-.572-.022-1.14-.187-1.642-.495l-4.807-3.005c-.33-.22-.572-.55-.704-.924-.132-.374-.132-.77 0-1.144.132-.374.374-.704.704-.924l4.807-3.005c.502-.308 1.07-.473 1.642-.495h.022c.266 0 .517.107.704.297.187.19.297.44.297.704v5.712h.022z" />
                    </svg>
                  </div>

                  {/* Platform info */}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-pink-400">
                      Apple Music
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {contributor.appleMusicId}
                    </span>
                  </div>
                </div>

                {/* External link icon */}
                <ExternalLink className="w-4 h-4 text-pink-400/60 group-hover/link:text-pink-400 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all duration-300" />
              </a>
            )}
          </div>
        )}

        {/* Hover shine effect */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent transition-opacity duration-500 pointer-events-none ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
            transition: 'transform 0.8s ease-in-out, opacity 0.5s ease-in-out',
          }}
        />
      </div>
    </div>
  );
};

export default ContributorCard;
