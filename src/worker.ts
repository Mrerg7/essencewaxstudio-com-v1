/**
 * Edge Worker: canonical URLs, permanent redirects, real 404s.
 *
 * Resolves GSC "Page with redirect" and related indexing reasons:
 *  - Same-host /index.html, /index, /404.html aliases never 301/307 — the
 *    homepage aliases serve at 200 with an apex canonical; 404 paths return a
 *    real 404 + noindex (no soft-404, no redirect flag).
 *  - Extensionless HTML paths (/insights) 301 to the trailing-slash canonical
 *    instead of Cloudflare's temporary asset 307 (permanent → one hop).
 *  - www / http / *.workers.dev one-hop 301 to https://essencewaxstudio.com.
 *  - Leftover asset 307/302 responses are promoted to absolute 301s.
 *  - /sitemap.xml is served at 200 (rewrite to sitemap-index.xml).
 *  - HTML 200s carry a self-referencing Link canonical + security headers.
 */
const CANONICAL_HOST = 'essencewaxstudio.com';
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

interface Env {
  ASSETS: {
    fetch(input: Request | string, init?: RequestInit): Promise<Response>;
  };
}

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Frame-Options': 'SAMEORIGIN',
};

function collapseSlashes(pathname: string): string {
  const collapsed = pathname.replace(/\/{2,}/g, '/');
  return collapsed === '' ? '/' : collapsed;
}

function hasFileExtension(pathname: string): boolean {
  const lastSegment = pathname.split('/').pop() ?? '';
  return lastSegment.includes('.');
}

function isHomeAlias(pathname: string): boolean {
  const p = collapseSlashes(pathname);
  return p === '/' || /^\/index(\.html)?\/?$/i.test(p);
}

function isNotFoundPath(pathname: string): boolean {
  const p = collapseSlashes(pathname);
  return /^\/404(\.html)?\/?$/i.test(p);
}

/** Collapse /index.html onto its directory URL for redirect targets. */
function directoryPath(pathname: string): string {
  let p = collapseSlashes(pathname);
  if (/^\/index(\.html)?\/?$/i.test(p)) return '/';
  if (/\/index\.html\/?$/i.test(p)) {
    p = p.replace(/index\.html\/?$/i, '');
    return p === '' ? '/' : p;
  }
  return p;
}

/** Canonical path: directory URL + trailing slash for extensionless HTML routes. */
function canonicalPath(pathname: string): string {
  const p = directoryPath(pathname);
  if (p !== '/' && !p.endsWith('/') && !hasFileExtension(p)) {
    return `${p}/`;
  }
  return p;
}

function absoluteUrl(requestUrl: URL, pathname: string): string {
  const next = new URL(requestUrl.toString());
  next.protocol = 'https:';
  next.hostname = CANONICAL_HOST;
  next.port = '';
  next.pathname = pathname;
  next.hash = '';
  return next.toString();
}

function finalizeHtml(
  page: Response,
  url: URL,
  options: { status?: number; canonicalPath?: string; noindex?: boolean } = {},
): Response {
  const headers = new Headers(page.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');

  const status = options.status ?? page.status;
  if (status === 404 || options.noindex) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  if (status === 200) {
    const path = options.canonicalPath ?? canonicalPath(url.pathname);
    headers.set('Link', `<${CANONICAL_ORIGIN}${path}>; rel="canonical"`);
  }

  return new Response(page.body, {
    status,
    statusText: status === 404 ? 'Not Found' : page.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = (request.headers.get('host') ?? url.hostname)
      .split(':')[0]
      .toLowerCase();

    if (LOCAL_HOSTS.has(host)) {
      return env.ASSETS.fetch(request);
    }

    const proto = (
      request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '')
    ).toLowerCase();

    // Real 404 for the 404 document — never a redirect or soft-200.
    if (isNotFoundPath(url.pathname)) {
      const page = await env.ASSETS.fetch(new URL('/404/', url.origin).toString());
      return finalizeHtml(page, url, { status: 404, noindex: true });
    }

    // Off-host (http / www / workers.dev): one-hop 301 to the apex canonical.
    const offHost = proto === 'http' || host !== CANONICAL_HOST;
    if (offHost) {
      return Response.redirect(absoluteUrl(url, canonicalPath(url.pathname)), 301);
    }

    // Homepage aliases: serve at 200 with apex canonical (no same-host
    // redirect, so GSC does not report "Page with redirect" for /index.html).
    if (isHomeAlias(url.pathname)) {
      const page = await env.ASSETS.fetch(new URL('/', url.origin).toString());
      if (page.status === 307 || page.status === 302) {
        return Response.redirect(CANONICAL_ORIGIN + '/', 301);
      }
      return finalizeHtml(page, url, { canonicalPath: '/' });
    }

    // Crawler convenience URL — 200 rewrite, no redirect chain.
    if (url.pathname === '/sitemap.xml') {
      return env.ASSETS.fetch(new URL('/sitemap-index.xml', url.origin).toString());
    }

    // Permanent trailing-slash / directory normalization before assets run
    // (prevents Cloudflare's temporary 307 for HTML paths).
    const target = canonicalPath(url.pathname);
    if (url.pathname !== target) {
      const dest = new URL(absoluteUrl(url, target));
      dest.search = url.search;
      return Response.redirect(dest.toString(), 301);
    }

    const assetResponse = await env.ASSETS.fetch(request);

    // Promote any leftover temporary asset redirects to permanent apex 301s.
    if (assetResponse.status === 307 || assetResponse.status === 302 || assetResponse.status === 301) {
      const location = assetResponse.headers.get('Location');
      if (location) {
        const dest = new URL(location, CANONICAL_ORIGIN);
        dest.protocol = 'https:';
        dest.hostname = CANONICAL_HOST;
        dest.port = '';
        dest.pathname = canonicalPath(dest.pathname);
        dest.hash = '';
        return Response.redirect(dest.toString(), 301);
      }
    }

    const contentType = assetResponse.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      return assetResponse;
    }

    if (assetResponse.status === 404) {
      return finalizeHtml(assetResponse, url, { status: 404, noindex: true });
    }

    if (assetResponse.status === 200) {
      return finalizeHtml(assetResponse, url, { canonicalPath: target });
    }

    return finalizeHtml(assetResponse, url);
  },
};
