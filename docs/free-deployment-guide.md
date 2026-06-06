# Free Deployment Guide

This guide uses a free-friendly split deployment:

- Frontend: Vercel Hobby
- Backend API: Render Free Web Service
- Database: Supabase Free Postgres

This is suitable for product review, stakeholder walkthroughs, and light public access. It is not the same as a scaled production launch because free services can have limits, cold starts, and storage constraints.

## Why This Stack

Vercel Hobby is free for personal projects and small-scale applications. Render Free supports Node.js web services, but free web services can spin down after inactivity and have an ephemeral filesystem. Supabase Free includes hosted Postgres with free project limits, including a 500 MB database size allowance.

## 1. Prepare The Repository

Before deploying, make sure the local project passes:

```bash
npm run typecheck
npm run test
npm run build
npm audit --audit-level=high
```

Commit and push your latest changes to GitHub.

## 2. Create Supabase Postgres

1. Go to Supabase.
2. Create a new project.
3. Save the database password somewhere safe.
4. Open `Project Settings > Database`.
5. Copy the pooled or direct Postgres connection string.
6. Replace `[YOUR-PASSWORD]` with your actual database password.

Use this value as `DATABASE_URL` in Render.

Free-tier setup:

- Keep seeded showcase data small.
- Do not upload real client documents.
- Treat uploaded file handling as metadata/local persistence unless external object storage is added.

## 3. Deploy Backend API To Render

Create a new Render Web Service from the GitHub repository.

Settings:

```text
Runtime: Node
Root Directory: leave blank
Build Command: npm install && npm run db:generate && npm run build
Start Command: node server/dist/server.js
Instance Type: Free
```

Environment variables:

```text
DATABASE_URL=<your Supabase Postgres connection string>
PORT=4000
CLIENT_ORIGIN=<your Vercel frontend URL after frontend deploy>
OPENAI_API_KEY=<your OpenAI key, optional>
OPENAI_MODEL=gpt-5.4-mini
AI_PROVIDER=openai
```

If you want no token cost:

```text
AI_PROVIDER=local
```

After the first backend deploy succeeds, apply the database schema and seed data from your local machine using the Supabase `DATABASE_URL`:

```bash
DATABASE_URL="<your Supabase Postgres connection string>" npm run db:push
DATABASE_URL="<your Supabase Postgres connection string>" npm run db:seed
```

Then test:

```text
https://your-api-name.onrender.com/api/health
```

Expected result:

```json
{
  "data": {
    "status": "ok",
    "service": "asun-migrations-api"
  }
}
```

## 4. Deploy Frontend To Vercel

Create a new Vercel project from the same GitHub repository.

Settings:

```text
Framework Preset: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Environment variables:

```text
VITE_API_BASE_URL=https://your-api-name.onrender.com
```

Deploy the frontend, then copy the Vercel production URL.

## 5. Update Render CORS

Return to Render and set:

```text
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
```

Redeploy the Render service after changing this value.

## 6. Smoke Test The Live App

Open the Vercel URL and test:

1. Select `Registered Migration Agent`.
2. Open Dashboard.
3. Open Matters.
4. Generate AI Matter Brief.
5. Upload document metadata.
6. Generate AI Document Review.
7. Create invoice.
8. Mock-pay invoice.
9. Open Reports and generate AI Report Insights.
10. Switch to `Client Portal User`.
11. Generate AI Portal Guidance.

## 7. Free-Tier Notes

Expect these tradeoffs:

- Render Free can cold start after inactivity.
- Render Free local filesystem is ephemeral, so do not rely on local file persistence for real uploaded files.
- Supabase Free has usage and size limits.
- Vercel Hobby is intended for personal/non-commercial use.
- OpenAI usage is not free unless `AI_PROVIDER=local`.

## Review URL Set

Share these links with reviewers:

```text
Product URL: https://your-vercel-app.vercel.app
API health: https://your-api-name.onrender.com/api/health
GitHub repo: https://github.com/<your-user>/<your-repo>
```

## When To Upgrade

Upgrade from this free setup when you need:

- no backend cold starts
- persistent document/file storage
- real authentication/MFA
- production domains and monitoring
- higher database capacity
- real Stripe, DocuSign, and email provider credentials
