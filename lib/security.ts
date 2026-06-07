// Rate limiting and security utilities for API endpoints
// Prevents abuse, bot attacks, and brute force attempts

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string
}

interface RequestRecord {
  count: number
  resetTime: number
}

class RateLimiter {
  private store: Map<string, RequestRecord> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    this.startCleanup()
  }

  private startCleanup() {
    setInterval(() => {
      const now = Date.now()
      for (const [key, record] of this.store.entries()) {
        if (record.resetTime < now) {
          this.store.delete(key)
        }
      }
    }, this.config.windowMs)
  }

  isLimited(identifier: string): boolean {
    const now = Date.now()
    const record = this.store.get(identifier)

    if (!record || record.resetTime < now) {
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      })
      return false
    }

    record.count++
    return record.count > this.config.maxRequests
  }

  getRemaining(identifier: string): number {
    const record = this.store.get(identifier)
    if (!record) return this.config.maxRequests

    return Math.max(0, this.config.maxRequests - record.count)
  }

  reset(identifier: string): void {
    this.store.delete(identifier)
  }
}

// Preset configurations for different endpoints
export const RATE_LIMITS = {
  login: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again later',
  }),

  register: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later',
  }),

  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later',
  }),

  emailVerification: new RateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 3,
    message: 'Too many verification attempts, please try again later',
  }),

  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Search rate limited, please slow down',
  }),

  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'API rate limit exceeded',
  }),
}

// Bot detection utilities
export class BotDetector {
  private suspiciousPatterns = [
    /bot|crawler|spider|scraper/i,
    /headlesschrome|phantom|puppeteer/i,
    /curl|wget|requests/i,
  ]

  private userAgents = new Set()
  private ips = new Map<string, { count: number; timestamp: number }>()

  isLikelyBot(userAgent: string, ip: string): boolean {
    // Check user agent patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        return true
      }
    }

    // Check for missing standard headers
    if (!userAgent || userAgent.length < 10) {
      return true
    }

    // Check IP reputation (multiple requests in short time)
    const now = Date.now()
    const record = this.ips.get(ip)

    if (record) {
      if (now - record.timestamp < 1000) {
        // Less than 1 second since last request
        record.count++
        if (record.count > 10) return true
      } else {
        record.count = 1
        record.timestamp = now
      }
    } else {
      this.ips.set(ip, { count: 1, timestamp: now })
    }

    return false
  }

  validateCaptcha(token: string): Promise<boolean> {
    // Implement actual CAPTCHA validation with third-party service
    // This is a placeholder
    return Promise.resolve(!!(token && token.length > 0))
  }
}

// Middleware for rate limiting
export function createRateLimitMiddleware(
  limiter: RateLimiter,
  getIdentifier: (req: any) => string,
  statusCode: number = 429
) {
  return (req: any, res: any, next: any) => {
    const identifier = getIdentifier(req)
    const remaining = limiter.getRemaining(identifier)

    res.set('X-RateLimit-Limit', '5')
    res.set('X-RateLimit-Remaining', Math.max(0, remaining).toString())

    if (limiter.isLimited(identifier)) {
      return res.status(statusCode).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(15 * 60),
      })
    }

    next()
  }
}

// Input validation and sanitization
export class InputValidator {
  static sanitizeEmail(email: string): string {
    return email.trim().toLowerCase().slice(0, 254)
  }

  static sanitizeUsername(username: string): string {
    return username.trim().slice(0, 50).replace(/[^a-z0-9_-]/gi, '')
  }

  static validatePassword(password: string): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('At least one number')

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }
}

// CORS and security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

// CSRF token generation
export function generateCSRFToken(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

// Password hashing (use bcrypt in production)
export function hashPassword(password: string): Promise<string> {
  // This is a placeholder - use bcrypt in production
  const crypto = require('crypto')
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex')
  return Promise.resolve(`${salt}:${hash}`)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  const crypto = require('crypto')
  const [salt, hashToCompare] = hash.split(':')
  const computedHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex')
  return Promise.resolve(computedHash === hashToCompare)
}
