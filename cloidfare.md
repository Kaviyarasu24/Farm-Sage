# Cloudflare Hosting Guide (Farm Sage)

This guide explains how to deploy this Next.js project to Cloudflare using the OpenNext Cloudflare adapter.

## Recommended Path

Use Cloudflare Workers + OpenNext for best compatibility with modern Next.js App Router projects.

## Prerequisites

- Cloudflare account
- Node.js 20+
- pnpm installed
- A Cloudflare API token with permissions for Workers and Pages/Zone settings

## 1. Install Deployment Dependencies

Run in project root:

```bash
pnpm add -D wrangler @opennextjs/cloudflare
```

## 2. Add Build and Deploy Scripts

Update package scripts in package.json:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "cf:build": "opennextjs-cloudflare build",
    "cf:preview": "opennextjs-cloudflare preview",
    "cf:deploy": "opennextjs-cloudflare deploy"
  }
}
```

If your installed package exposes command names differently, run:

```bash
pnpm opennextjs-cloudflare --help
```

and adjust the script command names to match.

## 3. Create Wrangler Config

Create wrangler.jsonc in project root:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "farm-sage-ai-assistant",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-03-13",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "observability": {
    "enabled": true
  }
}
```

Notes:
- Keep compatibility_date current when you upgrade tooling.
- The main/assets paths are based on OpenNext output.

## 4. Login to Cloudflare

```bash
pnpm wrangler login
```

Alternative CI flow (no interactive login):
- Use CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in CI secrets.

## 5. Add Environment Variables

Your app needs this variable in Cloudflare:

- OPENROUTER_API_KEY

Set it as a Worker secret:

```bash
pnpm wrangler secret put OPENROUTER_API_KEY
```

Also set it in local development using .env.local.

## 6. Build and Deploy

```bash
pnpm cf:build
pnpm cf:deploy
```

After deploy, Cloudflare returns your workers.dev URL.

## 7. Attach Custom Domain (Optional)

1. Open Cloudflare Dashboard > Workers & Pages.
2. Select your Worker.
3. Add a Custom Domain route.
4. Ensure DNS is proxied through Cloudflare.

## 8. Verify Production Behavior

Test these flows on the deployed URL:

- Chat message roundtrip (calls /api/chat)
- Weather loading and manual coordinates
- Voice input in supported browser
- Image upload/camera selection UI

## 9. Troubleshooting

### Build fails with Node API/runtime errors

- Confirm "nodejs_compat" is enabled in wrangler.jsonc.
- Update wrangler and @opennextjs/cloudflare to latest compatible versions.

### API route returns missing key error

- Re-run: wrangler secret put OPENROUTER_API_KEY
- Redeploy after updating secrets.

### Geolocation or microphone not working

- Browser must allow permissions.
- Use HTTPS domain (workers.dev/custom domain is HTTPS by default).

### Static assets or images not loading

- Confirm assets.directory points to .open-next/assets.
- Rebuild and redeploy.

## Optional: Cloudflare Pages Path

If you specifically want Cloudflare Pages (instead of Workers-first), use Cloudflare's current Next.js Pages integration docs and map the same OPENROUTER_API_KEY environment variable in Pages settings. For modern App Router apps, Workers + OpenNext is usually the smoother option.
