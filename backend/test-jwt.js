const jwt = require('jsonwebtoken');

const user = {
  id: '507f1f77bcf86cd799439011',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'ADMIN',
  isActive: true,
  isProfileComplete: true,
  emailVerified: true
};

const token = jwt.sign(
  { 
    sub: user.id,
    email: user.email,
    role: user.role
  },
  'your-jwt-secret-here',
  { expiresIn: '24h' }
);

console.log('JWT Token:', token);
console.log('\nUse this token in the Authorization header:');
console.log('Authorization: Bearer', token);
console.log('\nOr set it in localStorage:');
console.log(`localStorage.setItem('auth-storage', JSON.stringify({state:{accessToken:'${token}',user:${JSON.stringify(user)}}}));`);