import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useAuthStore } from './store/auth.store'
import { useLanguageStore } from './store/language.store'
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/common/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load pages
const HomePage = lazy(() => import('./pages/Home'))
const LoginPage = lazy(() => import('./pages/Login'))
const DashboardPage = lazy(() => import('./pages/Dashboard'))
const ImprovedReleaseSubmissionPage = lazy(() => import('./pages/ImprovedReleaseSubmissionWithDnD'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminSubmissionsPage = lazy(() => import('./pages/admin/AdminSubmissions'))
const SubmissionManagementPage = lazy(() => import('./pages/admin/SubmissionManagement'))
const ArtistProfileGuidePage = lazy(() => import('./pages/ArtistProfileGuide'))
const TechnicalGuidePage = lazy(() => import('./components/submission/TechnicalGuide'))
const SubmissionSuccessPage = lazy(() => import('./pages/submission/SubmissionSuccess'))
const SubmissionsPage = lazy(() => import('./pages/Submissions'))
const GuidePage = lazy(() => import('./pages/Guide'))
const SettingsPage = lazy(() => import('./pages/Settings'))
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomers'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettings'))
const AdminAccountsPage = lazy(() => import('./pages/admin/AdminAccounts'))
const DropboxCallbackPage = lazy(() => import('./pages/DropboxCallback'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallback'))
const ProfileCompletePage = lazy(() => import('./pages/ProfileComplete'))
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetup'))
const RoleSelectPage = lazy(() => import('./pages/RoleSelect'))
const DebugAuthPage = lazy(() => import('./pages/DebugAuth'))
const AccountSettingsPage = lazy(() => import('./pages/AccountSettings'))
const RegisterPage = lazy(() => import('./pages/Register'))

function App() {
  const authStore = useAuthStore()
  const languageStore = useLanguageStore()
  const hasAuthHydrated = authStore._hasHydrated
  const hasLanguageHydrated = languageStore._hasHydrated
  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.user?.role

  // Mark stores as hydrated
  useEffect(() => {
    if (!hasAuthHydrated) {
      authStore.setHasHydrated(true)
    }
    if (!hasLanguageHydrated) {
      languageStore.setHasHydrated(true)
    }
  }, [hasAuthHydrated, hasLanguageHydrated, authStore, languageStore])

  // Initialize dark mode on app load
  useEffect(() => {
    // Initialize dark mode
    const theme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (theme === 'dark' || (!theme && systemPrefersDark)) {
      document.documentElement.classList.add('dark')
      // Add dark class to body as well for CSS compatibility
      if (document.body) {
        document.body.classList.add('dark')
      }
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      // Remove dark class from body as well
      if (document.body) {
        document.body.classList.remove('dark')
      }
      document.documentElement.style.colorScheme = 'light'
    }
  }, [])

  // Wait for both stores to hydrate
  if (!hasAuthHydrated || !hasLanguageHydrated) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />
        } />
        <Route path="/" element={<HomePage />} />
        <Route path="/technical-guide" element={<TechnicalGuidePage />} />
        <Route path="/dropbox-callback" element={<DropboxCallbackPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/profile-setup" element={
          isAuthenticated ? <ProfileSetupPage /> : <Navigate to="/login" />
        } />
        <Route path="/profile-complete" element={
          isAuthenticated ? <ProfileCompletePage /> : <Navigate to="/login" />
        } />
        <Route path="/role-select" element={<RoleSelectPage />} />
        <Route path="/debug-auth" element={<DebugAuthPage />} />

        {/* Protected routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            isAuthenticated ? <DashboardPage /> : <Navigate to="/login" state={{ from: '/dashboard' }} />
          } />
          <Route path="/release-submission-modern" element={
            isAuthenticated ? (
              <ErrorBoundary>
                <ImprovedReleaseSubmissionPage />
              </ErrorBoundary>
            ) : <Navigate to="/login" state={{ from: '/release-submission-modern' }} />
          } />
          <Route path="/release-submission-improved" element={
            isAuthenticated ? (
              <ErrorBoundary>
                <ImprovedReleaseSubmissionPage />
              </ErrorBoundary>
            ) : <Navigate to="/login" state={{ from: '/release-submission-improved' }} />
          } />
          <Route path="/artist-profile-guide" element={
            isAuthenticated ? <ArtistProfileGuidePage /> : <Navigate to="/login" state={{ from: '/artist-profile-guide' }} />
          } />
          <Route path="/submission-success" element={
            isAuthenticated ? <SubmissionSuccessPage /> : <Navigate to="/login" />
          } />
          <Route path="/submissions" element={
            isAuthenticated ? <SubmissionsPage /> : <Navigate to="/login" state={{ from: '/submissions' }} />
          } />
          <Route path="/guide" element={
            isAuthenticated ? <GuidePage /> : <Navigate to="/login" state={{ from: '/guide' }} />
          } />
          <Route path="/settings" element={
            isAuthenticated ? <SettingsPage /> : <Navigate to="/login" state={{ from: '/settings' }} />
          } />
          <Route path="/account" element={
            isAuthenticated ? <AccountSettingsPage /> : <Navigate to="/login" state={{ from: '/account' }} />
          } />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            isAuthenticated && userRole === 'ADMIN' ? <AdminDashboardPage /> : <Navigate to="/login" />
          } />
          <Route path="/admin/submissions" element={
            isAuthenticated && userRole === 'ADMIN' ? <AdminSubmissionsPage /> : <Navigate to="/login" />
          } />
          <Route path="/admin/submission-management" element={
            isAuthenticated && userRole === 'ADMIN' ? <SubmissionManagementPage /> : <Navigate to="/login" />
          } />
          <Route path="/admin/customers" element={
            isAuthenticated && userRole === 'ADMIN' ? <AdminCustomersPage /> : <Navigate to="/login" />
          } />
          <Route path="/admin/settings" element={
            isAuthenticated && userRole === 'ADMIN' ? <AdminSettingsPage /> : <Navigate to="/login" />
          } />
          <Route path="/admin/accounts" element={
            isAuthenticated && userRole === 'ADMIN' ? <AdminAccountsPage /> : <Navigate to="/login" />
          } />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App