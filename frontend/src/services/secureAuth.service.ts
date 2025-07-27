import { getSecureTokenStorage } from './secureTokenStorage';

// Production-safe auth service with enhanced security
class SecureAuthService {
  private tokenStorage = getSecureTokenStorage();
  private refreshPromise: Promise<string | null> | null = null;

  // Token expiry check without exposing payload
  private isTokenExpired(exp: number): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 60; // 1 minute buffer
    return currentTime >= (exp - bufferTime);
  }

  // Store token expiry separately to avoid parsing JWT in client
  private async storeTokenWithExpiry(token: string): Promise<void> {
    // Extract expiry without exposing full payload
    const parts = token.split('.');
    if (parts.length !== 3) return;

    try {
      const payload = JSON.parse(atob(parts[1]));
      await this.tokenStorage.setToken('accessToken', token);
      await this.tokenStorage.setToken('tokenExpiry', payload.exp.toString());
    } catch {
      // Silently fail
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await this.tokenStorage.getToken('accessToken');
      const expiry = await this.tokenStorage.getToken('tokenExpiry');

      if (!token || !expiry) return null;

      if (this.isTokenExpired(parseInt(expiry))) {
        const newToken = await this.refreshAccessToken();
        return newToken;
      }

      return token;
    } catch {
      return null;
    }
  }

  async setAuth(user: any, accessToken: string, refreshToken: string): Promise<void> {
    // Store tokens securely
    await this.storeTokenWithExpiry(accessToken);
    await this.tokenStorage.setToken('refreshToken', refreshToken);

    // Store minimal user info (no sensitive data)
    await this.tokenStorage.setToken('userId', user.id);
    await this.tokenStorage.setToken('userRole', user.role);
  }

  async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async _performRefresh(): Promise<string | null> {
    try {
      const refreshToken = await this.tokenStorage.getToken('refreshToken');
      if (!refreshToken) return null;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
        }
        return null;
      }

      const data = await response.json();
      await this.storeTokenWithExpiry(data.accessToken);

      if (data.refreshToken) {
        await this.tokenStorage.setToken('refreshToken', data.refreshToken);
      }

      return data.accessToken;
    } catch {
      return null;
    }
  }

  hasToken(): boolean {
    // This method is synchronous, so we check sessionStorage as backup
    return sessionStorage.getItem('_auth') !== null;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  logout(): void {
    this.tokenStorage.clearAll();
    sessionStorage.clear();

    // Clear httpOnly cookie
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {});
  }

  async register(data: any): Promise<any> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return await response.json();
  }
}

// Create singleton instance
const secureAuthService = new SecureAuthService();

// Prevent access to the service object
Object.freeze(secureAuthService);
Object.freeze(SecureAuthService.prototype);

export { secureAuthService };
