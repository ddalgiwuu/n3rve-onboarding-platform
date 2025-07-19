import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ReleaseSubmissionNew from '@/pages/ImprovedReleaseSubmissionWithDnD'

/**
 * Wrapper component that ensures hydration is complete before rendering ReleaseSubmissionNew
 * This prevents React error #310 by avoiding conditional hook calls
 */
export default function HydratedReleaseSubmission() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Simple delay to ensure stores are hydrated
    // This is more reliable than complex hydration checking
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 150) // Slightly longer delay for safety

    return () => clearTimeout(timer)
  }, [])

  if (!isReady) {
    return <LoadingSpinner fullScreen />
  }

  // Only render the actual component after hydration delay
  return <ReleaseSubmissionNew />
}