/**
 * N3RVE Onboarding Platform - Complete Content Data
 * 실제 애플리케이션에서 추출한 모든 텍스트 콘텐츠
 * Framer에서 직접 사용 가능한 구조화된 데이터
 */

export const N3RVEContent = {
  // 브랜드 정보
  brand: {
    name: "N3RVE",
    tagline: "Elevate Your Music Journey",
    description: "음악가를 위한 혁신적인 온보딩 플랫폼",
    year: "2025"
  },

  // 로그인 페이지 콘텐츠
  login: {
    title: {
      ko: "N3RVE에 오신 것을 환영합니다",
      en: "Welcome to N3RVE"
    },
    subtitle: {
      ko: "음악 여정을 시작하세요",
      en: "Start Your Music Journey"
    },
    form: {
      email: {
        label: { ko: "이메일", en: "Email" },
        placeholder: { ko: "이메일을 입력하세요", en: "Enter your email" },
        error: { ko: "올바른 이메일을 입력하세요", en: "Please enter a valid email" }
      },
      password: {
        label: { ko: "비밀번호", en: "Password" },
        placeholder: { ko: "비밀번호를 입력하세요", en: "Enter your password" },
        error: { ko: "비밀번호는 8자 이상이어야 합니다", en: "Password must be at least 8 characters" }
      },
      rememberMe: { ko: "로그인 상태 유지", en: "Remember me" },
      forgotPassword: { ko: "비밀번호를 잊으셨나요?", en: "Forgot password?" }
    },
    buttons: {
      signIn: { ko: "로그인", en: "Sign In" },
      signUp: { ko: "회원가입", en: "Sign Up" },
      googleSignIn: { ko: "Google로 로그인", en: "Sign in with Google" }
    },
    messages: {
      loading: { ko: "로그인 중...", en: "Signing in..." },
      success: { ko: "로그인 성공!", en: "Login successful!" },
      error: { ko: "로그인에 실패했습니다", en: "Login failed" }
    },
    links: {
      createAccount: { ko: "계정이 없으신가요? 회원가입", en: "Don't have an account? Sign up" },
      terms: { ko: "이용약관", en: "Terms of Service" },
      privacy: { ko: "개인정보처리방침", en: "Privacy Policy" }
    }
  },

  // 회원가입 페이지 콘텐츠
  register: {
    title: {
      ko: "N3RVE 계정 만들기",
      en: "Create Your N3RVE Account"
    },
    subtitle: {
      ko: "음악 커리어를 한 단계 높여보세요",
      en: "Take your music career to the next level"
    },
    form: {
      firstName: {
        label: { ko: "이름", en: "First Name" },
        placeholder: { ko: "이름", en: "First name" }
      },
      lastName: {
        label: { ko: "성", en: "Last Name" },
        placeholder: { ko: "성", en: "Last name" }
      },
      email: {
        label: { ko: "이메일", en: "Email" },
        placeholder: { ko: "example@email.com", en: "example@email.com" }
      },
      password: {
        label: { ko: "비밀번호", en: "Password" },
        placeholder: { ko: "8자 이상의 비밀번호", en: "At least 8 characters" },
        requirements: {
          ko: [
            "최소 8자 이상",
            "대문자 1개 이상",
            "소문자 1개 이상",
            "숫자 1개 이상",
            "특수문자 1개 이상"
          ],
          en: [
            "At least 8 characters",
            "At least 1 uppercase letter",
            "At least 1 lowercase letter",
            "At least 1 number",
            "At least 1 special character"
          ]
        }
      },
      confirmPassword: {
        label: { ko: "비밀번호 확인", en: "Confirm Password" },
        placeholder: { ko: "비밀번호를 다시 입력하세요", en: "Re-enter your password" },
        error: { ko: "비밀번호가 일치하지 않습니다", en: "Passwords do not match" }
      },
      agreement: {
        ko: "이용약관 및 개인정보처리방침에 동의합니다",
        en: "I agree to the Terms of Service and Privacy Policy"
      }
    },
    buttons: {
      createAccount: { ko: "계정 만들기", en: "Create Account" },
      googleSignUp: { ko: "Google로 가입하기", en: "Sign up with Google" }
    },
    links: {
      alreadyHaveAccount: { ko: "이미 계정이 있으신가요? 로그인", en: "Already have an account? Sign in" }
    }
  },

  // 역할 선택 페이지
  roleSelect: {
    title: {
      ko: "당신의 역할을 선택하세요",
      en: "Select Your Role"
    },
    subtitle: {
      ko: "N3RVE에서 어떤 일을 하시나요?",
      en: "What brings you to N3RVE?"
    },
    roles: [
      {
        id: "artist",
        title: { ko: "아티스트", en: "Artist" },
        description: { 
          ko: "음악을 만들고 발매하는 뮤지션",
          en: "Musicians who create and release music"
        },
        features: {
          ko: ["음원 등록", "프로필 관리", "수익 관리", "팬 소통"],
          en: ["Release music", "Manage profile", "Track earnings", "Fan engagement"]
        }
      },
      {
        id: "label",
        title: { ko: "레이블", en: "Label" },
        description: {
          ko: "아티스트와 음원을 관리하는 레이블",
          en: "Labels managing artists and releases"
        },
        features: {
          ko: ["다중 아티스트 관리", "통합 대시보드", "계약 관리", "마케팅 도구"],
          en: ["Multi-artist management", "Unified dashboard", "Contract management", "Marketing tools"]
        }
      },
      {
        id: "distributor",
        title: { ko: "유통사", en: "Distributor" },
        description: {
          ko: "음원 유통 및 배급 서비스",
          en: "Music distribution and delivery services"
        },
        features: {
          ko: ["대량 음원 처리", "글로벌 유통", "실시간 리포트", "API 연동"],
          en: ["Bulk processing", "Global distribution", "Real-time reports", "API integration"]
        }
      }
    ],
    buttons: {
      continue: { ko: "계속하기", en: "Continue" },
      skip: { ko: "나중에 선택", en: "Choose later" }
    }
  },

  // 프로필 설정 페이지
  profileSetup: {
    title: {
      ko: "프로필 설정",
      en: "Profile Setup"
    },
    steps: [
      {
        title: { ko: "기본 정보", en: "Basic Information" },
        fields: {
          artistName: {
            label: { ko: "아티스트명", en: "Artist Name" },
            placeholder: { ko: "활동명을 입력하세요", en: "Enter your artist name" }
          },
          realName: {
            label: { ko: "본명", en: "Real Name" },
            placeholder: { ko: "실명을 입력하세요", en: "Enter your real name" }
          },
          birthDate: {
            label: { ko: "생년월일", en: "Date of Birth" },
            placeholder: { ko: "YYYY-MM-DD", en: "YYYY-MM-DD" }
          },
          nationality: {
            label: { ko: "국적", en: "Nationality" },
            placeholder: { ko: "국적 선택", en: "Select nationality" }
          }
        }
      },
      {
        title: { ko: "연락처 정보", en: "Contact Information" },
        fields: {
          phone: {
            label: { ko: "전화번호", en: "Phone Number" },
            placeholder: { ko: "010-0000-0000", en: "+1-234-567-8900" }
          },
          email: {
            label: { ko: "이메일", en: "Email" },
            placeholder: { ko: "email@example.com", en: "email@example.com" }
          },
          address: {
            label: { ko: "주소", en: "Address" },
            placeholder: { ko: "주소를 입력하세요", en: "Enter your address" }
          }
        }
      },
      {
        title: { ko: "아티스트 정보", en: "Artist Information" },
        fields: {
          genre: {
            label: { ko: "장르", en: "Genre" },
            placeholder: { ko: "주요 장르 선택", en: "Select primary genre" },
            options: {
              ko: ["K-POP", "힙합", "R&B", "록", "인디", "일렉트로닉", "재즈", "클래식", "기타"],
              en: ["K-POP", "Hip-Hop", "R&B", "Rock", "Indie", "Electronic", "Jazz", "Classical", "Other"]
            }
          },
          bio: {
            label: { ko: "아티스트 소개", en: "Artist Bio" },
            placeholder: { 
              ko: "당신의 음악과 스토리를 들려주세요 (최소 50자)",
              en: "Tell us about your music and story (min 50 characters)"
            }
          },
          socialMedia: {
            label: { ko: "소셜 미디어", en: "Social Media" },
            platforms: ["Instagram", "Twitter", "TikTok", "YouTube", "Spotify", "SoundCloud"]
          }
        }
      }
    ],
    buttons: {
      previous: { ko: "이전", en: "Previous" },
      next: { ko: "다음", en: "Next" },
      save: { ko: "저장", en: "Save" },
      complete: { ko: "프로필 완성", en: "Complete Profile" }
    },
    progress: {
      step: { ko: "단계", en: "Step" },
      of: { ko: "중", en: "of" }
    }
  },

  // 대시보드 콘텐츠
  dashboard: {
    greeting: {
      morning: { ko: "좋은 아침이에요", en: "Good morning" },
      afternoon: { ko: "좋은 오후에요", en: "Good afternoon" },
      evening: { ko: "좋은 저녁이에요", en: "Good evening" }
    },
    stats: {
      totalReleases: { ko: "총 발매 수", en: "Total Releases" },
      activeSubmissions: { ko: "진행 중인 제출", en: "Active Submissions" },
      earnings: { ko: "수익", en: "Earnings" },
      streams: { ko: "스트리밍 수", en: "Total Streams" }
    },
    quickActions: {
      title: { ko: "빠른 작업", en: "Quick Actions" },
      newRelease: { ko: "새 음원 등록", en: "New Release" },
      viewAnalytics: { ko: "분석 보기", en: "View Analytics" },
      manageCatalog: { ko: "카탈로그 관리", en: "Manage Catalog" },
      support: { ko: "지원 센터", en: "Support Center" }
    },
    recentActivity: {
      title: { ko: "최근 활동", en: "Recent Activity" },
      submitted: { ko: "제출됨", en: "Submitted" },
      approved: { ko: "승인됨", en: "Approved" },
      rejected: { ko: "거절됨", en: "Rejected" },
      processing: { ko: "처리 중", en: "Processing" }
    }
  },

  // 음원 제출 양식
  releaseSubmission: {
    title: { ko: "음원 제출", en: "Release Submission" },
    steps: {
      ko: [
        "기본 정보",
        "아티스트 정보",
        "트랙 정보",
        "기여자",
        "음원 파일",
        "커버 아트",
        "메타데이터",
        "유통 설정",
        "가격 설정",
        "마케팅",
        "법적 정보",
        "검토 및 제출"
      ],
      en: [
        "Basic Info",
        "Artist Info",
        "Track Info",
        "Contributors",
        "Audio Files",
        "Cover Art",
        "Metadata",
        "Distribution",
        "Pricing",
        "Marketing",
        "Legal Info",
        "Review & Submit"
      ]
    },
    fields: {
      albumTitle: {
        label: { ko: "앨범명", en: "Album Title" },
        placeholder: { ko: "앨범 제목을 입력하세요", en: "Enter album title" }
      },
      releaseDate: {
        label: { ko: "발매일", en: "Release Date" },
        placeholder: { ko: "날짜 선택", en: "Select date" }
      },
      primaryGenre: {
        label: { ko: "주 장르", en: "Primary Genre" },
        placeholder: { ko: "장르 선택", en: "Select genre" }
      },
      language: {
        label: { ko: "주 언어", en: "Primary Language" },
        placeholder: { ko: "언어 선택", en: "Select language" }
      },
      explicit: {
        label: { ko: "19금 콘텐츠", en: "Explicit Content" },
        options: {
          yes: { ko: "예", en: "Yes" },
          no: { ko: "아니오", en: "No" }
        }
      }
    },
    validation: {
      required: { ko: "필수 입력 항목입니다", en: "This field is required" },
      invalidFormat: { ko: "올바른 형식이 아닙니다", en: "Invalid format" },
      tooShort: { ko: "너무 짧습니다", en: "Too short" },
      tooLong: { ko: "너무 깁니다", en: "Too long" }
    },
    buttons: {
      saveDraft: { ko: "임시 저장", en: "Save Draft" },
      preview: { ko: "미리보기", en: "Preview" },
      submit: { ko: "제출", en: "Submit" },
      cancel: { ko: "취소", en: "Cancel" }
    }
  },

  // 설정 페이지
  settings: {
    title: { ko: "설정", en: "Settings" },
    sections: {
      account: {
        title: { ko: "계정 설정", en: "Account Settings" },
        items: {
          changePassword: { ko: "비밀번호 변경", en: "Change Password" },
          twoFactor: { ko: "2단계 인증", en: "Two-Factor Authentication" },
          connectedAccounts: { ko: "연결된 계정", en: "Connected Accounts" },
          deleteAccount: { ko: "계정 삭제", en: "Delete Account" }
        }
      },
      notifications: {
        title: { ko: "알림 설정", en: "Notification Settings" },
        items: {
          email: { ko: "이메일 알림", en: "Email Notifications" },
          push: { ko: "푸시 알림", en: "Push Notifications" },
          sms: { ko: "SMS 알림", en: "SMS Notifications" },
          marketing: { ko: "마케팅 정보 수신", en: "Marketing Communications" }
        }
      },
      privacy: {
        title: { ko: "개인정보 설정", en: "Privacy Settings" },
        items: {
          profileVisibility: { ko: "프로필 공개 설정", en: "Profile Visibility" },
          dataDownload: { ko: "내 데이터 다운로드", en: "Download My Data" },
          dataSharing: { ko: "데이터 공유 설정", en: "Data Sharing Settings" }
        }
      },
      preferences: {
        title: { ko: "환경 설정", en: "Preferences" },
        items: {
          language: { ko: "언어", en: "Language" },
          timezone: { ko: "시간대", en: "Timezone" },
          dateFormat: { ko: "날짜 형식", en: "Date Format" },
          currency: { ko: "통화", en: "Currency" },
          theme: { ko: "테마", en: "Theme" }
        }
      }
    },
    buttons: {
      save: { ko: "저장", en: "Save Changes" },
      cancel: { ko: "취소", en: "Cancel" },
      reset: { ko: "초기화", en: "Reset to Default" }
    }
  },

  // 공통 UI 요소
  common: {
    navigation: {
      home: { ko: "홈", en: "Home" },
      dashboard: { ko: "대시보드", en: "Dashboard" },
      releases: { ko: "음원 관리", en: "Releases" },
      analytics: { ko: "분석", en: "Analytics" },
      earnings: { ko: "수익", en: "Earnings" },
      support: { ko: "지원", en: "Support" },
      settings: { ko: "설정", en: "Settings" },
      logout: { ko: "로그아웃", en: "Logout" }
    },
    actions: {
      edit: { ko: "수정", en: "Edit" },
      delete: { ko: "삭제", en: "Delete" },
      view: { ko: "보기", en: "View" },
      download: { ko: "다운로드", en: "Download" },
      share: { ko: "공유", en: "Share" },
      copy: { ko: "복사", en: "Copy" },
      refresh: { ko: "새로고침", en: "Refresh" },
      search: { ko: "검색", en: "Search" },
      filter: { ko: "필터", en: "Filter" },
      sort: { ko: "정렬", en: "Sort" }
    },
    status: {
      loading: { ko: "로딩 중...", en: "Loading..." },
      saving: { ko: "저장 중...", en: "Saving..." },
      processing: { ko: "처리 중...", en: "Processing..." },
      success: { ko: "성공", en: "Success" },
      error: { ko: "오류", en: "Error" },
      warning: { ko: "경고", en: "Warning" },
      info: { ko: "정보", en: "Info" }
    },
    messages: {
      confirmDelete: { 
        ko: "정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
        en: "Are you sure you want to delete? This action cannot be undone."
      },
      saveSuccess: { ko: "저장되었습니다", en: "Saved successfully" },
      saveError: { ko: "저장 중 오류가 발생했습니다", en: "Error occurred while saving" },
      networkError: { ko: "네트워크 오류가 발생했습니다", en: "Network error occurred" },
      sessionExpired: { ko: "세션이 만료되었습니다", en: "Session expired" }
    },
    time: {
      today: { ko: "오늘", en: "Today" },
      yesterday: { ko: "어제", en: "Yesterday" },
      thisWeek: { ko: "이번 주", en: "This Week" },
      lastWeek: { ko: "지난 주", en: "Last Week" },
      thisMonth: { ko: "이번 달", en: "This Month" },
      lastMonth: { ko: "지난 달", en: "Last Month" },
      days: { ko: "일", en: "days" },
      hours: { ko: "시간", en: "hours" },
      minutes: { ko: "분", en: "minutes" },
      seconds: { ko: "초", en: "seconds" }
    }
  },

  // 푸터 정보
  footer: {
    company: {
      name: "N3RVE",
      tagline: { ko: "음악의 미래", en: "The Future of Music" },
      copyright: "© 2025 N3RVE. All rights reserved."
    },
    links: {
      about: { ko: "회사 소개", en: "About Us" },
      careers: { ko: "채용", en: "Careers" },
      press: { ko: "언론", en: "Press" },
      blog: { ko: "블로그", en: "Blog" },
      help: { ko: "도움말", en: "Help" },
      contact: { ko: "문의", en: "Contact" }
    },
    legal: {
      terms: { ko: "이용약관", en: "Terms of Service" },
      privacy: { ko: "개인정보처리방침", en: "Privacy Policy" },
      cookies: { ko: "쿠키 정책", en: "Cookie Policy" },
      licenses: { ko: "라이선스", en: "Licenses" }
    },
    social: {
      instagram: "@n3rve_official",
      twitter: "@n3rve_music",
      facebook: "n3rvemusic",
      youtube: "N3RVE Official"
    }
  }
};

// 언어별 컨텐츠 추출 헬퍼 함수
export function getContent(path: string, language: 'ko' | 'en' = 'en') {
  const keys = path.split('.');
  let content: any = N3RVEContent;
  
  for (const key of keys) {
    content = content[key];
    if (!content) return '';
  }
  
  if (typeof content === 'object' && (content.ko || content.en)) {
    return content[language] || content.en || '';
  }
  
  return content;
}

// Framer 컴포넌트에서 사용 예시
// import { N3RVEContent, getContent } from './ContentData'
// const loginTitle = getContent('login.title', 'ko')
// const submitButton = getContent('releaseSubmission.buttons.submit', 'en')