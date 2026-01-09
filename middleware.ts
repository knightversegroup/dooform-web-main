import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers middleware for Dooform Web
 *
 * Adds security headers to all responses to protect against
 * common web vulnerabilities.
 */
export function middleware(request: NextRequest) {
  // Get the response
  const response = NextResponse.next();

  // Content Security Policy
  // SECURITY NOTE: 'unsafe-inline' is required for Next.js inline styles and some third-party scripts.
  // 'unsafe-eval' is needed for:
  //   - Development: Hot Module Replacement (HMR), source maps, React DevTools
  //   - Production: Some analytics/tracking scripts that use eval()
  // TODO: Consider implementing nonce-based CSP for stricter security (requires Next.js middleware changes)
  // See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
  const isDev = process.env.NODE_ENV === 'development';
  const localSources = isDev ? ' http://localhost:* http://127.0.0.1:* ws://localhost:*' : '';

  // Only allow unsafe-eval in development for HMR/debugging; use strict-dynamic in production if possible
  const evalDirective = isDev ? " 'unsafe-eval'" : '';

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${evalDirective} https://www.googletagmanager.com https://www.google-analytics.com https://*.posthog.com https://apis.google.com https://accounts.google.com https://*.gstatic.com https://*.dooform.com${localSources}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' https://*.dooform.com https://*.firebaseapp.com https://*.googleapis.com https://www.google-analytics.com https://*.posthog.com wss://*.firebaseio.com https://accounts.google.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com${localSources}`,
    "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com https://*.dooform.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com https://*.dooform.com",
    "frame-ancestors 'none'",
  ];

  // Only upgrade insecure requests in production
  if (!isDev) {
    cspDirectives.push("upgrade-insecure-requests");
  }

  // Add security headers
  const headers = response.headers;

  // Content Security Policy
  headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // Cross-Origin-Opener-Policy - allow popups for OAuth flows
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Cross-Origin-Embedder-Policy - required for some features but can break OAuth
  // headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter (legacy browsers)
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature-Policy)
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // HTTP Strict Transport Security (HSTS)
  // Only enable in production with valid HTTPS
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

/**
 * Matcher configuration
 * Apply middleware to all routes except static files and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - API routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
