# EssenceWaxStudio.com

Elegant informational site for a Brazilian wax studio brand concept + domain acquisition listing.

**Domain available for acquisition — $50,000 USD** → [sales@desertrich.com](mailto:sales@desertrich.com)

## Deploy

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`

## SEO checklist (on-page, shipped)

- [x] Title/description with domain + price + buyer intent (`src/config/site.ts` defaults)
- [x] Self-referencing canonical on every page, trailing-slash normalized (Layout + `src/worker.ts` Link header)
- [x] `www` / `http` / `*.workers.dev` → apex one-hop 301; sitemap URLs all 200 (worker)
- [x] **GSC "Page with redirect" fix** — same-host `/index.html`, `/index` serve **200** with apex canonical (no redirect); extensionless paths 301 (not Cloudflare 307) to trailing-slash canonical; `/404`, `/404/`, `/404.html` return a real **404 + noindex** (no soft-404); leftover asset 307/302 promoted to absolute 301; `/sitemap.xml` rewritten at 200
- [x] `trailingSlash: 'always'` in Astro; internal links + sitemap all trailing-slash
- [x] Sitemap (`/sitemap-index.xml`) referenced from `robots.txt` via `@astrojs/sitemap`
- [x] Structured data: `Organization`, `WebSite`, `WebPage`, `Product` + `Offer` ($50,000), `FAQPage` (matches visible FAQ), `BreadcrumbList`, `Article` on posts
- [x] Single H1 per page; FAQ + how-to-buy + inquiry form on homepage
- [x] `llms.txt` + `hreflang`, OG/Twitter cards with image alt
- [x] Insights content hub (`/insights/`) — 6 indexable posts, internally linked
- [x] Google Fonts via `<link>` + preconnect (no CSS `@import`)
- [x] Security headers, `Cache-Control: must-revalidate` for HTML

## DA checklist (off-site, do these after deploy)

1. **Search Console + Bing** — verify (meta already in Layout), submit `https://essencewaxstudio.com/sitemap-index.xml`, request indexing for `/` and `/insights/`.
2. **GitHub repo homepage** — set the repo About → homepage to `https://essencewaxstudio.com` (DA-98 backlink; repo already links the domain).
3. **Marketplace listings** — list on Sedo, Afternic/SedoADS, Dan.com, Atom.com, GoDaddy Auctions. Each listing page is a live backlink and buyer channel; point the listing URL at the apex.
4. **Escrow/marketplace profile links** — seller profile on Escrow.com / Dan with site URL.
5. **Cross-link the Desert Rich portfolio** — add a footer link to `essencewaxstudio.com` from sister domains you control (desertrich.com, other wax domains) — relevant, editorial, not a PBN pattern (link from contextual blocks, not sitewide boilerplate).
6. **Social/profile links** — X, LinkedIn company, Bio.link/Linktree, Behance; all pointing to the apex.
7. **Content syndication** — republish 1–2 insights on Medium/Substack with `rel=canonical` back to the original; post to Reddit r/Entrepreneur / r/smallbusiness threads about naming a business (editorial, not spam).
8. **Niche directories** — beauty/wax business name roundups, "premium domains for sale" lists, DNForum/Sedo forum signature (where allowed).
9. **Digital PR** — respond to HARO/Connectively queries on brand naming and salon marketing; each placement is a genuine authority link.
10. **Measure** — track DA/DR monthly; target: GSC impressions on `essence wax studio` + `wax studio name` queries, referral visits to `#acquisition`.
