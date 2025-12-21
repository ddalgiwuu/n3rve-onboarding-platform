import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from '@/hooks/useTranslation';
import { useHydration } from '@/hooks/useHydration';
import { Music, FileText, Users, Upload, ChevronRight, Calendar, Building2, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import useSafeStore from '@/hooks/useSafeStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const isHydrated = useHydration();
  const user = useSafeStore(useAuthStore, (state) => state.user);
  const { t } = useTranslation();

  // Fetch user submissions data - MUST be before early return!
  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ['user-submissions'],
    queryFn: async () => {
      try {
        const response = await api.get('/submissions/user', {
          params: { page: 1, limit: 10 }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching submissions:', error);
        return { data: [], total: 0 };
      }
    },
    enabled: isHydrated && !!user,
    retry: 1
  });

  // Show loading spinner until stores are hydrated
  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  // Calculate stats from fetched data
  const submissions = submissionsData?.data || [];
  const totalSubmissions = submissionsData?.total || 0;
  const pendingCount = submissions.filter((s: any) => s.status === 'PENDING').length;

  // Get unique artists from submissions
  const uniqueArtists = new Set(submissions.map((s: any) => s.artistName));
  const artistsCount = uniqueArtists.size;

  const stats = [
    {
      label: t('dashboard.totalReleases'),
      value: totalSubmissions.toString(),
      icon: Music,
      // Legacy: 'from-purple-500 to-pink-500'
      color: 'bg-white/15 dark:bg-white/10',
      description: t('dashboard.registeredAlbums')
    },
    {
      label: t('dashboard.pending'),
      value: pendingCount.toString(),
      icon: FileText,
      // Legacy: 'from-blue-500 to-cyan-500'
      color: 'bg-white/12 dark:bg-white/8',
      description: t('dashboard.awaitingReview')
    },
    {
      label: t('dashboard.artists'),
      value: artistsCount.toString(),
      icon: Users,
      // Legacy: 'from-green-500 to-emerald-500'
      color: 'bg-white/10 dark:bg-white/8',
      description: t('dashboard.registeredArtists')
    }
  ];

  // Get recent submissions (max 5 for dashboard)
  const recentSubmissions = submissions.slice(0, 5);

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "success" | "outline" => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'secondary';
      case 'review': return 'default';
      default: return 'outline';
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

  // Sophisticated glass background with depth
  return (
    <div className="min-h-screen bg-transparent p-6 relative overflow-hidden">
      {/* Monochrome gradient layers for subtle depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/[0.02] dark:bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-white/[0.015] dark:bg-white/[0.025] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-black/[0.02] dark:bg-black/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Noise texture for sophistication */}
      <div
        className="fixed inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay'
        }}
      />

      <div className="w-full space-y-6 relative z-10">
        {/* Welcome Section - Compact */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
              {t('dashboard.welcome')}, {user?.name || user?.email}!
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('dashboard.haveGreatDay')}
            </p>
          </div>
          <Button asChild size="lg" variant="default">
            <Link to="/release-submission-modern">
              <Upload className="w-5 h-5" />
              {t('dashboard.newRelease')}
            </Link>
          </Button>
        </div>

        {/* Stats Grid - Redesigned with shadcn Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="group animate-fade-in cursor-pointer magnetic"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {stat.description}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.color} bg-surface border-modern-soft magnetic glass-shimmer group-hover:scale-110 transition-all duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Submissions - Redesigned */}
        <Card className="animate-fade-in-delay">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{t('dashboard.recentSubmissions')}</CardTitle>
                <CardDescription className="mt-1">
                  Track your latest release submissions
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/submissions" className="flex items-center gap-1">
                  {t('dashboard.viewAll')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {submissionsLoading ? (
                <div className="text-center py-12">
                  <LoadingSpinner />
                </div>
              ) : recentSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('dashboard.noSubmittedTracks')}
                  </p>
                </div>
              ) : (
                recentSubmissions.map((submission: any, index: number) => (
                  <Link
                    key={submission.id}
                    to={`/release-projects`}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] dark:bg-white/[0.02] border border-white/5 dark:border-white/5 hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:border-white/10 dark:hover:border-white/10 transition-all duration-200 group animate-slide-in-left"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3 rounded-lg bg-white/10 dark:bg-white/8 group-hover:bg-white/15 dark:group-hover:bg-white/12 transition-colors">
                        <Music className="w-5 h-5 text-gray-900 dark:text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-gray-700 dark:group-hover:text-gray-100 transition-colors">
                          {submission.albumTitle || submission.albumTitleEn || 'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {submission.artistName || submission.artistNameEn || 'Unknown Artist'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(submission.releaseDate || submission.createdAt).toLocaleDateString()}
                      </div>
                      <Badge variant={getStatusVariant(submission.status?.toLowerCase() || 'pending')}>
                        {getStatusText(submission.status?.toLowerCase() || 'pending')}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Unified Card */}
        <Card className="magnetic">
          <CardHeader>
            <CardTitle>빠른 실행</CardTitle>
            <CardDescription>자주 사용하는 기능에 빠르게 접근하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              <Link
                to="/release-submission-modern"
                className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-200 group"
              >
                <div className="p-3 rounded-lg bg-surface border-modern-soft magnetic glass-shimmer group-hover:scale-110 transition-all duration-300">
                  <Upload className="w-6 h-6 text-gray-900 dark:text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('dashboard.registerNewRelease')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.registerAndDistribute')}
                  </p>
                </div>
              </Link>

              <Link
                to="/guide"
                className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-200 group"
              >
                <div className="p-3 rounded-lg bg-surface border-modern-soft magnetic glass-shimmer group-hover:scale-110 transition-all duration-300">
                  <FileText className="w-6 h-6 text-gray-900 dark:text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('dashboard.viewGuide')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.checkGuidelines')}
                  </p>
                </div>
              </Link>

              <Link
                to="/artist-profile-guide"
                className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-200 group"
              >
                <div className="p-3 rounded-lg bg-surface border-modern-soft magnetic glass-shimmer group-hover:scale-110 transition-all duration-300">
                  <Users className="w-6 h-6 text-gray-900 dark:text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('dashboard.artistProfile')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.profileWritingGuide')}
                  </p>
                </div>
              </Link>

              <Link
                to="/account"
                className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-200 group"
              >
                <div className="p-3 rounded-lg bg-surface border-modern-soft magnetic glass-shimmer group-hover:scale-110 transition-all duration-300">
                  <Building2 className="w-6 h-6 text-gray-900 dark:text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('dashboard.accountManagement')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.manageSubAccounts')}
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
