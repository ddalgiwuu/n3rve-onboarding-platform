/**
 * Security Tests — automated checks for common vulnerabilities.
 * Run: npx vitest run src/test/security.test.ts
 */
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');

function gitFiles(): string[] {
  return execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8' })
    .split('\n').filter(Boolean);
}

function grepTracked(pattern: string, glob = ''): string[] {
  try {
    const cmd = glob
      ? `git ls-files -- '${glob}' | xargs grep -ln "${pattern}" 2>/dev/null`
      : `git ls-files | xargs grep -ln "${pattern}" 2>/dev/null`;
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' })
      .split('\n').filter(Boolean)
      .filter(f => !f.includes('node_modules') && !f.includes('security.test'));
  } catch { return []; }
}

function grepContent(pattern: string, glob = ''): string[] {
  try {
    const cmd = glob
      ? `git ls-files -- '${glob}' | xargs grep -n "${pattern}" 2>/dev/null`
      : `git ls-files | xargs grep -n "${pattern}" 2>/dev/null`;
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' })
      .split('\n').filter(Boolean)
      .filter(f => !f.includes('node_modules') && !f.includes('security.test'));
  } catch { return []; }
}

// ============================================================
// 1. SECRET EXPOSURE
// ============================================================
describe('Secret Exposure', () => {
  it('no MongoDB passwords in tracked files', () => {
    const hits = grepTracked('7xojrRbDc6zK37Hr');
    expect(hits).toEqual([]);
  });

  it('no FUGA passwords in tracked files', () => {
    const hits = grepTracked('chp4zmk');
    expect(hits).toEqual([]);
  });

  it('no Google Client Secrets in tracked files', () => {
    const hits = grepTracked('GOCSPX');
    expect(hits).toEqual([]);
  });

  it('no Dropbox long-lived tokens in tracked files', () => {
    const hits = grepTracked('sl\\.u\\.AF24\\|sl\\.u\\.AGI2');
    expect(hits).toEqual([]);
  });

  it('no TOTP secrets in tracked files', () => {
    const hits = grepTracked('43WLULURXQZZU27B');
    expect(hits).toEqual([]);
  });

  it('no AWS access keys in tracked files', () => {
    const hits = grepTracked('AKIA[A-Z0-9]\\{16\\}');
    expect(hits).toEqual([]);
  });

  it('no private keys in tracked files', () => {
    const hits = grepTracked('BEGIN.*PRIVATE KEY');
    expect(hits).toEqual([]);
  });

  it('no .env files tracked (except .example)', () => {
    const envFiles = gitFiles().filter(f =>
      f.match(/\.env/) && !f.includes('example') && !f.includes('node_modules') && !f.includes('.d.ts')
    );
    expect(envFiles).toEqual([]);
  });

  it('no .pem or .key files tracked', () => {
    const keyFiles = gitFiles().filter(f =>
      f.match(/\.(pem|key|p12|pfx)$/) && !f.includes('node_modules')
    );
    expect(keyFiles).toEqual([]);
  });
});

// ============================================================
// 2. GIT HISTORY
// ============================================================
describe('Git History Clean', () => {
  const checkHistory = (pattern: string) => {
    try {
      const count = execSync(
        `git grep "${pattern}" $(git rev-list --all --max-count=100) 2>/dev/null | wc -l`,
        { cwd: ROOT, encoding: 'utf-8' }
      ).trim();
      return parseInt(count, 10);
    } catch { return 0; }
  };

  it('no MongoDB password in recent history', () => {
    expect(checkHistory('7xojrRbDc6zK37Hr')).toBe(0);
  });

  it('no FUGA password in recent history', () => {
    expect(checkHistory('chp4zmk')).toBe(0);
  });

  it('no Google secrets in recent history', () => {
    expect(checkHistory('GOCSPX')).toBe(0);
  });
});

// ============================================================
// 3. BACKEND SECURITY
// ============================================================
describe('Backend Security', () => {
  it('no JWT secret fallback to hardcoded value', () => {
    const hits = grepContent("|| 'secret'\\||| 'fallback'", '*.ts');
    const relevant = hits.filter(h => h.includes('JWT') || h.includes('jwt'));
    expect(relevant).toEqual([]);
  });

  it('JWT algorithm is explicitly set to HS256', () => {
    const moduleContent = fs.readFileSync(
      path.join(BACKEND, 'src/auth/auth.module.ts'), 'utf-8'
    );
    expect(moduleContent).toContain("algorithm: 'HS256'");
  });

  it('JWT strategy restricts algorithms', () => {
    const strategyContent = fs.readFileSync(
      path.join(BACKEND, 'src/auth/strategies/jwt.strategy.ts'), 'utf-8'
    );
    expect(strategyContent).toContain("algorithms: ['HS256']");
  });

  it('helmet is enabled', () => {
    const mainContent = fs.readFileSync(
      path.join(BACKEND, 'src/main.ts'), 'utf-8'
    );
    expect(mainContent).toContain('app.use(helmet())');
  });

  it('rate limiting is configured', () => {
    const moduleContent = fs.readFileSync(
      path.join(BACKEND, 'src/app.module.ts'), 'utf-8'
    );
    expect(moduleContent).toContain('ThrottlerModule');
    expect(moduleContent).toContain('ThrottlerGuard');
  });

  it('login endpoint has rate limiting', () => {
    const authContent = fs.readFileSync(
      path.join(BACKEND, 'src/auth/auth.controller.ts'), 'utf-8'
    );
    expect(authContent).toContain('@Throttle');
  });

  it('password validation requires uppercase + lowercase + number', () => {
    const authContent = fs.readFileSync(
      path.join(BACKEND, 'src/auth/auth.controller.ts'), 'utf-8'
    );
    expect(authContent).toContain('/[A-Z]/');
    expect(authContent).toContain('/[a-z]/');
    expect(authContent).toContain('/[0-9]/');
  });

  it('no sensitive console.log in backend auth', () => {
    const hits = grepContent(
      'console\\.log.*email\\|console\\.log.*password\\|console\\.log.*token\\|console\\.log.*Authorization',
      'backend/src/auth/*.ts'
    );
    expect(hits).toEqual([]);
  });

  it('no error.stack returned to clients', () => {
    const hits = grepContent('error\\.stack', 'backend/src/auth/*.ts');
    const responseLeaks = hits.filter(h =>
      h.includes('return') || h.includes('res.') || h.includes('response')
    );
    expect(responseLeaks).toEqual([]);
  });

  it('no password hash in API responses (spread operators)', () => {
    const authController = fs.readFileSync(
      path.join(BACKEND, 'src/auth/auth.controller.ts'), 'utf-8'
    );
    // getProfile and getMe should strip password
    expect(authController).toContain("password: _pw, ...userWithoutPassword");
  });

  it('admin accounts strip password from responses', () => {
    const content = fs.readFileSync(
      path.join(BACKEND, 'src/admin/admin-accounts.controller.ts'), 'utf-8'
    );
    // Should have password destructuring in list, create, and sub-account
    const passwordStrips = (content.match(/password.*\.\.\./g) || []).length;
    expect(passwordStrips).toBeGreaterThanOrEqual(3);
  });

  it('CORS uses explicit origin whitelist (no wildcard)', () => {
    const mainContent = fs.readFileSync(
      path.join(BACKEND, 'src/main.ts'), 'utf-8'
    );
    expect(mainContent).not.toContain("origin: '*'");
  });

  it('WebSocket CORS uses explicit origin whitelist', () => {
    const wsContent = fs.readFileSync(
      path.join(BACKEND, 'src/websocket/qc.gateway.ts'), 'utf-8'
    );
    expect(wsContent).not.toContain("origin: '*'");
  });

  it('no /uploads static serving without auth', () => {
    const mainContent = fs.readFileSync(
      path.join(BACKEND, 'src/main.ts'), 'utf-8'
    );
    // Should not have unprotected static serving
    expect(mainContent).not.toMatch(/app\.use\('\/uploads',\s*express\.static/);
  });

  it('admin emails come from env, not hardcoded', () => {
    const serviceContent = fs.readFileSync(
      path.join(BACKEND, 'src/auth/auth.service.ts'), 'utf-8'
    );
    expect(serviceContent).toContain('ADMIN_EMAILS');
    expect(serviceContent).not.toContain("'wonseok9706@gmail.com'");
  });

  it('no public config-check endpoint', () => {
    const appController = fs.readFileSync(
      path.join(BACKEND, 'src/app.controller.ts'), 'utf-8'
    );
    expect(appController).not.toContain("@Get('config-check')");
  });
});

// ============================================================
// 4. FRONTEND SECURITY
// ============================================================
describe('Frontend Security', () => {
  it('source maps are disabled', () => {
    const viteConfig = fs.readFileSync(
      path.join(FRONTEND, 'vite.config.ts'), 'utf-8'
    );
    expect(viteConfig).toContain('sourcemap: false');
  });

  it('no innerHTML with dynamic content (XSS)', () => {
    const hits = grepContent('innerHTML.*\\$\\{\\|innerHTML.*\\+', 'frontend/src/**/*.tsx');
    expect(hits).toEqual([]);
  });

  it('no eval() usage', () => {
    const hits = grepContent('\\beval(', 'frontend/src/**/*.ts');
    expect(hits).toEqual([]);
  });

  it('API base URL comes from env, not hardcoded production URL', () => {
    const apiContent = fs.readFileSync(
      path.join(FRONTEND, 'src/lib/api.ts'), 'utf-8'
    );
    expect(apiContent).toContain('import.meta.env');
  });
});

// ============================================================
// 5. DEPENDENCY VULNERABILITIES
// ============================================================
describe('Dependency Vulnerabilities', () => {
  it('backend has 0 npm audit vulnerabilities', () => {
    const result = execSync('npm audit --json 2>/dev/null || true', {
      cwd: BACKEND, encoding: 'utf-8'
    });
    try {
      const audit = JSON.parse(result);
      const total = audit.metadata?.vulnerabilities
        ? Object.values(audit.metadata.vulnerabilities as Record<string, number>).reduce((a: number, b: number) => a + b, 0)
        : 0;
      expect(total).toBe(0);
    } catch {
      // If JSON parse fails, check for "found 0 vulnerabilities" text
      expect(result).toContain('0 vulnerabilities');
    }
  });

  it('frontend has 0 npm audit vulnerabilities', () => {
    const result = execSync('npm audit --json 2>/dev/null || true', {
      cwd: FRONTEND, encoding: 'utf-8'
    });
    try {
      const audit = JSON.parse(result);
      const total = audit.metadata?.vulnerabilities
        ? Object.values(audit.metadata.vulnerabilities as Record<string, number>).reduce((a: number, b: number) => a + b, 0)
        : 0;
      expect(total).toBe(0);
    } catch {
      expect(result).toContain('0 vulnerabilities');
    }
  });
});

// ============================================================
// 6. INFRASTRUCTURE
// ============================================================
describe('Infrastructure Security', () => {
  it('no EC2 IP addresses in tracked files', () => {
    const hits = grepTracked('52\\.78\\.81\\.116');
    expect(hits).toEqual([]);
  });

  it('no EC2 instance IDs in tracked files', () => {
    const hits = grepTracked('i-0fd6de9be');
    expect(hits).toEqual([]);
  });

  it('Dockerfile does not contain hardcoded secrets', () => {
    const dockerfile = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf-8');
    expect(dockerfile).not.toContain('chp4zmk');
    expect(dockerfile).not.toContain('7xojrRbDc6zK37Hr');
    expect(dockerfile).not.toContain('GOCSPX');
  });

  it('Dockerfile Dropbox ARGs have no default values', () => {
    const dockerfile = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf-8');
    const dropboxArgs = dockerfile.match(/ARG VITE_DROPBOX.*/g) || [];
    dropboxArgs.forEach(arg => {
      expect(arg).not.toContain('slffi4mfztfohqd');
      expect(arg).not.toContain('siffi4mfztfohqd');
    });
  });
});
