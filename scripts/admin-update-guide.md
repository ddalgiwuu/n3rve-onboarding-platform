# ckalargiros@gmail.com 관리자 권한 설정 가이드

## 문제 해결 방법

### 1. MongoDB Atlas에서 직접 수정하기
1. MongoDB Atlas 웹 콘솔 접속
2. Browse Collections → n3rve-platform → users 컬렉션
3. email이 "ckalargiros@gmail.com"인 문서 찾기
4. Edit 버튼 클릭
5. role 필드를 정확히 **"ADMIN"** (대문자)로 설정
6. isActive 필드가 true인지 확인

### 2. 로그아웃 후 재로그인
MongoDB에서 수정 후:
1. 웹사이트에서 완전히 로그아웃
2. 브라우저 캐시 삭제 (Ctrl+Shift+R 또는 Cmd+Shift+R)
3. 다시 로그인

### 3. EC2 서버에서 직접 실행 (가장 확실한 방법)
```bash
# 1. EC2 서버 접속
ssh -i "N3RVE_AWS.pem" ubuntu@ec2-52-78-81-116.ap-northeast-2.compute.amazonaws.com

# 2. 프로젝트 디렉토리로 이동
cd /home/ubuntu/n3rve-platform

# 3. MongoDB CLI로 직접 업데이트
docker exec -it n3rve-platform-backend-1 node -e "
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function updateRole() {
  try {
    await client.connect();
    const db = client.db('n3rve-platform');
    const result = await db.collection('users').updateOne(
      { email: 'ckalargiros@gmail.com' },
      { \$set: { role: 'ADMIN', isActive: true } }
    );
    console.log('Updated:', result.modifiedCount);
  } finally {
    await client.close();
  }
}
updateRole();
"
```

### 4. 확인사항
MongoDB Atlas에서 다음 필드들이 올바른지 확인:
- `role`: "ADMIN" (정확히 대문자)
- `isActive`: true
- `email`: "ckalargiros@gmail.com"

### 5. Frontend 확인
로그인 후 개발자 도구(F12)의 Console에서:
```javascript
// 현재 유저 정보 확인
JSON.parse(localStorage.getItem('auth-storage'))
```

role이 "ADMIN"으로 표시되어야 합니다.

## 추가 디버깅
만약 여전히 작동하지 않으면:
1. MongoDB Atlas에서 user 문서 전체를 복사해서 확인
2. 대소문자나 공백 문제가 있는지 체크
3. 다른 ADMIN 유저와 필드 구조 비교