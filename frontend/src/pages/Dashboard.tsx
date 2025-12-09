import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from '@/hooks/useTranslation';
import { useHydration } from '@/hooks/useHydration';
import { Music, FileText, Users, Upload, ChevronRight, Calendar, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import useSafeStore from '@/hooks/useSafeStore';

export default function Dashboard() {
  const isHydrated = useHydration();
  const user = useSafeStore(useAuthStore, (state) => state.user);
  const { t } = useTranslation();

  // Show loading spinner until stores are hydrated
  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  const stats = [
    {
      label: t('dashboard.totalReleases'),
      value: '0',
      icon: Music,
      color: 'from-purple-500 to-pink-500',
      description: t('dashboard.registeredAlbums')
    },
    {
      label: t('dashboard.pending'),
      value: '0',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      description: t('dashboard.awaitingReview')
    },
    {
      label: t('dashboard.artists'),
      value: '0',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      description: t('dashboard.registeredArtists')
    }
  ];

  const recentSubmissions: any[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'review': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return t('dashboard.status.approved');
      case 'pending': return t('dashboard.status.pending');
      case 'review': return t('dashboard.status.inReview');
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="glass-premium rounded-3xl p-8 animate-fade-in relative overflow-hidden group">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 opacity-50" />

          {/* Floating particles */}
          <div className="absolute top-4 right-4 opacity-20">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-1 h-1 bg-pink-400 rounded-full animate-bounce ml-6 -mt-1" style={{ animationDelay: '0.3s' }} />
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce ml-3 -mt-2" style={{ animationDelay: '0.6s' }} />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2 animate-fade-in">
                {t('dashboard.welcome')}, {user?.name || user?.email}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 animate-fade-in-delay">
                {t('dashboard.haveGreatDay')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/release-submission-modern"
                className="glass-btn-primary text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Upload className="w-5 h-5" />
                {t('dashboard.newRelease')}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="glass-enhanced rounded-2xl p-6 hover-glass-lift animate-fade-in group relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                      {stat.value}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                    {stat.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Submissions */}
        <div className="glass-enhanced rounded-2xl p-6 animate-fade-in-delay hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.recentSubmissions')}
            </h2>
            <Link
              to="/submissions"
              className="glass-btn-modern text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
            >
              {t('dashboard.viewAll')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('dashboard.noSubmittedTracks')}
                </p>
              </div>
            ) : (
              recentSubmissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className="glass-effect p-4 rounded-xl hover:shadow-lg transition-all duration-300 animate-slide-in-left"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {submission.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {submission.artist}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {submission.date}
                      </div>
                      <span className={`badge-glass ${getStatusColor(submission.status)} px-3 py-1`}>
                        {getStatusText(submission.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/release-submission-modern"
            className="glass-premium rounded-2xl p-6 hover:-translate-y-2 hover:shadow-2xl text-center group animate-fade-in transition-all duration-500 relative overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </div>

            <div className="relative z-10">
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg mb-4 mx-auto w-fit group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {t('dashboard.registerNewRelease')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('dashboard.registerAndDistribute')}
              </p>
            </div>
          </Link>

          <Link
            to="/guide"
            className="glass-enhanced rounded-2xl p-6 hover-glass-lift text-center group animate-fade-in transition-all duration-300 relative overflow-hidden"
            style={{ animationDelay: '100ms' }}
          >
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg mb-4 mx-auto w-fit group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {t('dashboard.viewGuide')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('dashboard.checkGuidelines')}
            </p>
          </Link>

          <Link
            to="/artist-profile-guide"
            className="glass-enhanced rounded-2xl p-6 hover-glass-lift text-center group animate-fade-in transition-all duration-300 relative overflow-hidden"
            style={{ animationDelay: '200ms' }}
          >
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg mb-4 mx-auto w-fit group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              {t('dashboard.artistProfile')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('dashboard.profileWritingGuide')}
            </p>
          </Link>

          <Link
            to="/account"
            className="glass-enhanced rounded-2xl p-6 hover-glass-lift text-center group animate-fade-in transition-all duration-300 relative overflow-hidden"
            style={{ animationDelay: '300ms' }}
          >
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg mb-4 mx-auto w-fit group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {t('dashboard.accountManagement')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('dashboard.manageSubAccounts')}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
