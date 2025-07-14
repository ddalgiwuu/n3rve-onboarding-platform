import { ClipboardList, Users, CheckCircle, XCircle } from 'lucide-react'

export default function AdminDashboard() {
  // TODO: API에서 실제 데이터 가져오기
  const stats = {
    totalSubmissions: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    totalCustomers: 0
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">관리자 대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">전체 제출</p>
              <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">검토 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">승인됨</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">반려됨</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">전체 고객</p>
              <p className="text-2xl font-bold">{stats.totalCustomers}</p>
            </div>
            <Users className="w-8 h-8 text-n3rve-accent" />
          </div>
        </div>
      </div>

      {/* 최근 제출 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">최근 제출 내역</h2>
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-3">제출일</th>
                <th className="text-left pb-3">아티스트</th>
                <th className="text-left pb-3">앨범명</th>
                <th className="text-left pb-3">제출자</th>
                <th className="text-left pb-3">상태</th>
                <th className="text-left pb-3">작업</th>
              </tr>
            </thead>
            <tbody>
              {/* TODO: API에서 데이터 가져와서 표시 */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}