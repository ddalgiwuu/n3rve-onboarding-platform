import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useTranslation } from '@/store/language.store';

const DropboxCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    handleDropboxCallback();
  }, [location]);

  const handleDropboxCallback = async () => {
    try {
      // Extract the authorization code from URL
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      if (error) {
        setStatus('error');
        setError(errorDescription || 'Authorization failed');
        return;
      }

      if (!code) {
        setStatus('error');
        setError('No authorization code received');
        return;
      }

      // Exchange code for access token
      const response = await fetch('/api/dropbox/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      
      // Store the access token securely
      localStorage.setItem('dropbox_connected', 'true');
      
      setStatus('success');
      
      // Redirect back to submission page after a short delay
      setTimeout(() => {
        const returnPath = localStorage.getItem('dropbox_return_path') || '/submit';
        localStorage.removeItem('dropbox_return_path');
        navigate(returnPath);
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="glass-effect rounded-2xl p-8 text-center animate-fade-in">
          {status === 'loading' && (
            <>
              <Loader className="w-16 h-16 text-purple-400 mx-auto mb-6 animate-spin" />
              <h2 className="text-2xl font-bold text-white mb-4">
                {t('dropbox.connecting', 'Connecting to Dropbox...')}
              </h2>
              <p className="text-gray-300">
                {t('dropbox.pleaseWait', 'Please wait while we complete the connection')}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-scale-in">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                {t('dropbox.connected', 'Successfully Connected!')}
              </h2>
              <p className="text-gray-300 mb-6">
                {t('dropbox.connectedDesc', 'Your Dropbox account has been connected successfully')}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Loader className="w-4 h-4 animate-spin" />
                {t('dropbox.redirecting', 'Redirecting...')}
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center animate-scale-in">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                {t('dropbox.connectionFailed', 'Connection Failed')}
              </h2>
              <p className="text-gray-300 mb-6">
                {error || t('dropbox.errorDesc', 'Unable to connect to Dropbox. Please try again.')}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/submit')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all hover-lift"
                >
                  {t('dropbox.tryAgain', 'Try Again')}
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full px-6 py-3 glass-effect hover:bg-gray-800/50 rounded-lg font-medium transition-all"
                >
                  {t('dropbox.backToDashboard', 'Back to Dashboard')}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>
            {t('dropbox.havingIssues', 'Having issues?')}{' '}
            <a href="mailto:support@n3rve.com" className="text-purple-400 hover:text-purple-300 transition-colors">
              {t('dropbox.contactSupport', 'Contact support')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DropboxCallback;