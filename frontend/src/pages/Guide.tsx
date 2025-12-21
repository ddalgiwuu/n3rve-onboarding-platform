import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Music, Upload, FileText, CheckCircle, Users, TrendingUp,
  HelpCircle, Zap, Globe, ArrowRight, ChevronDown, ChevronUp, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Guide() {
  const navigate = useNavigate();
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);

  const guides = [
    {
      icon: Upload,
      title: '음원 제출 가이드',
      titleEn: 'Submission Guide',
      description: '새로운 음원을 제출하는 방법과 필수 정보를 안내합니다',
      descriptionEn: 'Learn how to submit new releases and required information',
      link: '/release-submission-modern',
      color: 'from-purple-500 to-pink-500',
      details: {
        steps: [
          '1. 기본 정보 입력: 아티스트명, 앨범 타이틀, 발매일',
          '2. 트랙 정보: 곡명, 작곡가, 작사가, ISRC 코드',
          '3. 파일 업로드: 오디오 파일, 커버 아트 (최소 3000x3000px)',
          '4. 메타데이터: 장르, 언어, 저작권 정보',
          '5. 배포 설정: 플랫폼 선택, 지역 설정',
          '6. 검토 및 제출: 모든 정보 확인 후 제출'
        ],
        checklist: [
          '✓ 고품질 오디오 파일 (WAV/FLAC 권장)',
          '✓ 정확한 메타데이터 정보',
          '✓ 3000x3000px 이상 커버 아트',
          '✓ ISRC 코드 (선택사항)',
          '✓ 저작권자 정보'
        ]
      }
    },
    {
      icon: Music,
      title: '아티스트 프로필 가이드',
      titleEn: 'Artist Profile Guide',
      description: '아티스트 정보 작성 및 DSP 연동 방법을 안내합니다',
      descriptionEn: 'Complete artist information and DSP integration',
      link: '/artist-profile-guide',
      color: 'from-blue-500 to-cyan-500',
      details: {
        steps: [
          '1. 기본 정보: 아티스트명, 국가, 바이오',
          '2. DSP ID 연동: Spotify Artist ID, Apple Music Artist ID',
          '3. 소셜 미디어: 공식 계정 URL 입력',
          '4. 프로필 이미지: 아티스트 사진, 배너 이미지',
          '5. 인증 요청: 플랫폼별 아티스트 인증 신청'
        ],
        tips: [
          '💡 Spotify Artist ID 찾기: Spotify for Artists에서 확인',
          '💡 Apple Music Artist ID: Apple Music 아티스트 페이지 URL에서 숫자 추출',
          '💡 고해상도 프로필 이미지 사용 (최소 1500x1500px)',
          '💡 모든 플랫폼의 아티스트명을 동일하게 유지'
        ]
      }
    },
    {
      icon: FileText,
      title: '기술 사양 가이드',
      titleEn: 'Technical Specifications',
      description: '음원 파일 포맷과 기술 요구사항을 확인하세요',
      descriptionEn: 'Audio file formats and technical requirements',
      link: '/guide',
      color: 'from-green-500 to-emerald-500',
      details: {
        audioSpecs: [
          '📀 권장 포맷: WAV 또는 FLAC (무손실)',
          '📀 최소 품질: 44.1kHz / 16bit',
          '📀 권장 품질: 48kHz / 24bit',
          '📀 스테레오 파일 필수',
          '📀 최대 파일 크기: 500MB per track'
        ],
        coverSpecs: [
          '🖼️ 최소 해상도: 3000x3000px',
          '🖼️ 권장 해상도: 4000x4000px',
          '🖼️ 포맷: JPG 또는 PNG',
          '🖼️ 최대 파일 크기: 5MB',
          '🖼️ 정사각형 비율 필수',
          '🖼️ RGB 컬러 모드'
        ]
      }
    },
    {
      icon: TrendingUp,
      title: '마케팅 가이드',
      titleEn: 'Marketing Guide',
      description: '효과적인 음원 마케팅 전략을 알아보세요',
      descriptionEn: 'Effective music marketing strategies',
      link: '/guide',
      color: 'from-orange-500 to-red-500',
      details: {
        strategies: [
          '🎯 발매 전 준비: 티저 콘텐츠, 소셜 미디어 예고',
          '🎯 발매일 최적화: 금요일 발매 권장',
          '🎯 플레이리스트 피칭: Spotify Editorial Playlist 신청',
          '🎯 소셜 미디어 활용: TikTok, Instagram Reels',
          '🎯 팬 참여 유도: 사전 저장, 스토리 공유',
          '🎯 데이터 분석: Spotify for Artists, Apple Music for Artists'
        ],
        timeline: [
          '📅 발매 4주 전: 티저 시작, 플레이리스트 피칭',
          '📅 발매 2주 전: 프리세이브 캠페인',
          '📅 발매 1주 전: 뮤직비디오 티저',
          '📅 발매일: 전체 콘텐츠 공개',
          '📅 발매 후 1주: 팬 반응 모니터링 및 추가 홍보'
        ]
      }
    }
  ];

  const quickTips = [
    {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      title: '정확한 메타데이터',
      text: '모든 필드를 정확하게 입력하면 승인이 빨라집니다'
    },
    {
      icon: Zap,
      iconColor: 'text-yellow-500',
      title: '고품질 오디오',
      text: 'WAV 또는 FLAC 포맷, 최소 44.1kHz/16bit 권장'
    },
    {
      icon: Globe,
      iconColor: 'text-blue-500',
      title: '글로벌 배포',
      text: '전 세계 주요 스트리밍 플랫폼에 자동 배포됩니다'
    },
    {
      icon: Users,
      iconColor: 'text-purple-500',
      title: '전문가 지원',
      text: '궁금한 사항이 있으면 언제든지 문의하세요'
    }
  ];

  const faqs = [
    {
      question: '음원 제출 후 승인까지 얼마나 걸리나요?',
      answer: '일반적으로 2-3 영업일 소요됩니다. 복잡한 경우 최대 7일이 걸릴 수 있습니다.'
    },
    {
      question: '어떤 파일 형식을 지원하나요?',
      answer: 'WAV, FLAC, MP3를 지원합니다. WAV 또는 FLAC를 권장합니다.'
    },
    {
      question: '커버 아트 요구사항은 무엇인가요?',
      answer: '최소 3000x3000px, JPG 또는 PNG 형식, 최대 5MB'
    },
    {
      question: '발매 후 수정이 가능한가요?',
      answer: '발매 전까지는 자유롭게 수정 가능합니다. 발매 후에는 제한적입니다.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                N3RVE 가이드
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                음원 배포를 위한 완벽한 가이드
              </p>
            </div>
          </div>
        </div>

        {/* Guide Cards with Expandable Details */}
        <div className="space-y-4">
          {guides.map((guide, index) => {
            const Icon = guide.icon;
            const isExpanded = expandedGuide === index;

            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Card Header - Clickable */}
                <div
                  onClick={() => setExpandedGuide(isExpanded ? null : index)}
                  className="group p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${guide.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{guide.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{guide.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-purple-600" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-6 bg-gray-50 dark:bg-gray-700/30 space-y-6">
                        {/* Steps */}
                        {guide.details.steps && (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              단계별 가이드
                            </h4>
                            <div className="space-y-2">
                              {guide.details.steps.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Checklist */}
                        {guide.details.checklist && (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">체크리스트</h4>
                            <div className="space-y-2">
                              {guide.details.checklist.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tips */}
                        {guide.details.tips && (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">유용한 팁</h4>
                            <div className="space-y-2">
                              {guide.details.tips.map((tip, idx) => (
                                <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                  {tip}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Audio Specs */}
                        {guide.details.audioSpecs && (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">오디오 파일 사양</h4>
                            <div className="space-y-2">
                              {guide.details.audioSpecs.map((spec, idx) => (
                                <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                  {spec}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Cover Specs */}
                        {guide.details.coverSpecs && (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">커버 아트 사양</h4>
                            <div className="space-y-2">
                              {guide.details.coverSpecs.map((spec, idx) => (
                                <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                  {spec}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Strategies */}
                        {guide.details.strategies && (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">마케팅 전략</h4>
                            <div className="space-y-2">
                              {guide.details.strategies.map((strategy, idx) => (
                                <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                  {strategy}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        {guide.details.timeline && (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">발매 타임라인</h4>
                            <div className="space-y-2">
                              {guide.details.timeline.map((item, idx) => (
                                <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-4 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(guide.link);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                          >
                            <Play className="w-4 h-4" />
                            시작하기
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Quick Tips */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            빠른 팁
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-6 h-6 ${tip.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{tip.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tip.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-purple-500" />
            자주 묻는 질문
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Q. {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  A. {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">추가 도움이 필요하신가요?</h2>
          <p className="mb-6 text-white/90">N3RVE 팀이 언제든지 도와드리겠습니다</p>
          <button
            onClick={() => window.location.href = 'mailto:support@n3rve.com'}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            문의하기
          </button>
        </div>
      </div>
    </div>
  );
}
