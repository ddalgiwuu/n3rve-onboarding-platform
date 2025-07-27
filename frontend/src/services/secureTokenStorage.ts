/**
 * Secure token storage using memory and encryption
 * Prevents token exposure through console or developer tools
 */

class SecureTokenStorage {
  private static instance: SecureTokenStorage;
  private tokens: Map<string, string> = new Map();
  private encryptionKey: CryptoKey | null = null;

  private constructor() {
    // Initialize encryption key
    this.initializeEncryption();

    // Protect against console access
    this.protectStorage();
  }

  static getInstance(): SecureTokenStorage {
    if (!SecureTokenStorage.instance) {
      SecureTokenStorage.instance = new SecureTokenStorage();
    }
    return SecureTokenStorage.instance;
  }

  private async initializeEncryption() {
    try {
      // Generate a random encryption key
      this.encryptionKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      // Fallback for older browsers
      this.encryptionKey = null;
    }
  }

  private protectStorage() {
    // Prevent storage object from being logged
    Object.defineProperty(this, 'tokens', {
      value: this.tokens,
      writable: false,
      enumerable: false,
      configurable: false
    });

    // Prevent toString/valueOf exploitation
    this.toString = () => '[SecureTokenStorage]';
    this.valueOf = () => '[SecureTokenStorage]';
  }

  private async encrypt(text: string): Promise<string> {
    if (!this.encryptionKey || !crypto.subtle) {
      // Fallback: simple obfuscation for older browsers
      return btoa(encodeURIComponent(text));
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  private async decrypt(encryptedText: string): Promise<string> {
    if (!this.encryptionKey || !crypto.subtle) {
      // Fallback for simple obfuscation
      return decodeURIComponent(atob(encryptedText));
    }

    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  async setToken(key: string, value: string): Promise<void> {
    if (!key || !value) return;

    try {
      const encrypted = await this.encrypt(value);
      this.tokens.set(key, encrypted);

      // Store refresh token in httpOnly cookie via API
      if (key === 'refreshToken') {
        await this.storeRefreshTokenSecurely(value);
      }
    } catch (error) {
      // Silently fail in production
      if (import.meta.env.DEV) {
        console.error('Token storage error:', error);
      }
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      const encrypted = this.tokens.get(key);
      if (!encrypted) return null;

      return await this.decrypt(encrypted);
    } catch (error) {
      // Silently fail in production
      if (import.meta.env.DEV) {
        console.error('Token retrieval error:', error);
      }
      return null;
    }
  }

  removeToken(key: string): void {
    this.tokens.delete(key);
  }

  clearAll(): void {
    this.tokens.clear();
  }

  private async storeRefreshTokenSecurely(token: string): Promise<void> {
    // Send refresh token to backend to store in httpOnly cookie
    try {
      await fetch('/api/auth/secure-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: token })
      });
    } catch (error) {
      // Fallback to encrypted localStorage
      const encrypted = await this.encrypt(token);
      sessionStorage.setItem('_rt', encrypted);
    }
  }
}

// Prevent direct access to the class
Object.freeze(SecureTokenStorage);
Object.freeze(SecureTokenStorage.prototype);

// Export only the getInstance method
export const getSecureTokenStorage = () => SecureTokenStorage.getInstance();
