import React from 'react'
import { CheckCircle, AlertCircle, FileAudio, FileImage, FileVideo, FileText } from 'lucide-react'

interface FileCheckItemProps {
  label: string
  file?: File | File[] | null
  status: 'complete' | 'optional' | 'missing'
  type?: 'audio' | 'image' | 'video' | 'text'
  preview?: string
}

export const FileCheckItem: React.FC<FileCheckItemProps> = ({
  label,
  file,
  status,
  type = 'audio',
  preview
}) => {
  const icons = {
    audio: FileAudio,
    image: FileImage,
    video: FileVideo,
    text: FileText
  }

  const Icon = icons[type]

  const statusConfig = {
    complete: {
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    optional: {
      icon: AlertCircle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10'
    },
    missing: {
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    }
  }

  const StatusIcon = statusConfig[status].icon

  const getFileInfo = () => {
    if (!file) return null

    if (Array.isArray(file)) {
      return `${file.length} ${file.length === 1 ? 'file' : 'files'}`
    }

    return file.name
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 dark:bg-gray-800/30">
      <div className={`p-2 rounded-lg ${statusConfig[status].bg}`}>
        <Icon className={`w-5 h-5 ${statusConfig[status].color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </span>
          <StatusIcon className={`w-4 h-4 ${statusConfig[status].color}`} />
        </div>
        {getFileInfo() && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {getFileInfo()}
          </div>
        )}
      </div>

      {preview && type === 'image' && (
        <img
          src={preview}
          alt={label}
          className="w-12 h-12 rounded object-cover"
        />
      )}
    </div>
  )
}
