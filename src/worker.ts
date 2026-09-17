/**
 * Edge Worker: permanent URL canonicalization.
 *
 * Resolves Search Console indexing reasons:
 *  - "Duplicate without user-selected canonical" — every HTML response carries a
 *    self-referencing canonical (Link header + <link rel="canonical"> in the page).
 *  - "Alternate page with proper canonical tag" — www / http / *.workers.dev and
 *    /index.html variants permanently 301 to the apex canonical URL.
 *  - "Blocked by robots.txt" — robots.txt is served through unchanged (Allow: /);
 *    non-canonical hosts are never served, and 404s are noindexed.
 */
const CANONICAL_HOST = 'essencewaxstudio.com';
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

interface Env {
  ASSETS: {
    fetch(input: Request | string, init?: RequestInit): Promise<Response>;
  };
}

function canonicalLocation(requestUrl: URL, pathname: string): string {
  const next = new URL(requestUrl.toString());
  next.protocol = 'https:';
  next.hostname = CANONICAL_HOST;
  next.pathname = pathname;
  next.hash = '';
  return next.toString();
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

    let pathname = url.pathname;
    let needsRedirect = false;

    if (proto === 'http' || url.protocol === 'http:') {
      needsRedirect = true;
    }

    if (host !== CANONICAL_HOST) {
      needsRedirect = true;
    }

    // Collapse index.html / bare /index onto / with a permanent redirect.
    if (/^\/index(\.html)?\/?$/i.test(pathname)) {
      pathname = '/';
      needsRedirect = true;
    }

    if (needsRedirect) {
      return Response.redirect(canonicalLocation(url, pathname), 301);
    }

    const assetResponse = await env.ASSETS.fetch(request);

    const contentType = assetResponse.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      return assetResponse;
    }

    const headers = new Headers(assetResponse.headers);

    if (assetResponse.status === 404) {
      headers.set('X-Robots-Tag', 'noindex, nofollow');
      return new Response(assetResponse.body, {
        status: 404,
        statusText: assetResponse.statusText,
        headers,
      });
    }

    if (assetResponse.status === 200) {
      const canonicalPath = url.pathname === '' ? '/' : url.pathname;
      headers.set('Link', `<${CANONICAL_ORIGIN}${canonicalPath}>; rel="canonical"`);
    }

    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  },
};
