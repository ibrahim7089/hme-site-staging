# HME Website

Public HME website and integrated publishing CMS built with Next.js 16.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The CMS is available at
[http://localhost:3000/admin](http://localhost:3000/admin).

For local development only, if CMS environment variables are omitted, the app uses
`data/hme-cms.db` with:

- Email: `admin@hme.local`
- Password: `ChangeMe123!`

Change these before using shared or production environments.

## Production CMS setup

Create a Turso/libSQL database, then configure the following environment variables
in Vercel:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `CMS_AUTH_SECRET` (minimum 32 characters)
- `CMS_ADMIN_EMAIL`
- `CMS_ADMIN_PASSWORD` (minimum 12 characters)
- `CMS_ADMIN_NAME` (optional)

Redeploy after adding them. On the first CMS request, the schema and initial Admin
account are created automatically.

## Google Reviews setup

The admin "Google Reviews" tab and the homepage 5-star showcase pull reviews from
Google Business Profile (formerly Google My Business) across every branch location
under one Google account, and can draft/post replies with AI help.

**1. Google Cloud project & API access (one-time, takes days — start early):**

1. In [Google Cloud Console](https://console.cloud.google.com), create a project (or
   use an existing one) and enable the **Business Profile APIs** (Account
   Management, Business Information, and the legacy My Business API for reviews).
2. Submit Google's [Business Profile API access request form](https://support.google.com/business/contact/api_default).
   Approval typically takes 3-10 business days. Google checks that your business
   site domain matches, the listing has been verified 60+ days, etc.
3. Once approved, create an **OAuth 2.0 Client ID** (type: Web application) under
   *APIs & Services → Credentials*. Add this Authorized redirect URI (matching
   your deployment exactly):
   `https://<your-domain>/api/admin/google-reviews/callback`

**2. Environment variables** (see `.env.example`):

- `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` — from the OAuth client above.
- `GOOGLE_OAUTH_REDIRECT_URI` — must exactly match the redirect URI registered in step 1.3.
- `GEMINI_API_KEY` — optional but recommended; a free key from
  [Google AI Studio](https://aistudio.google.com/apikey) is used to draft reply
  text. Without it, simple template replies are used instead.
- `CRON_SECRET` — any long random string; authorizes the scheduled sync job.

**3. Connect the account:** redeploy, then in `/admin` → **Google Reviews** →
**Connect Google Business Profile**, sign in with the Google account that manages
all branch listings, and approve access.

**4. Syncing:** click **Sync now** in the admin tab any time, or let the daily
cron job (`vercel.json`, 3am UTC) do it automatically. Vercel's **Hobby plan
only allows cron jobs once per day** — upgrade to Pro and shorten the schedule
in `vercel.json` for more frequent auto-syncing.

**Reply behavior:** 5-star reviews get an AI-drafted reply posted to Google
automatically (shown afterward in the "Recent auto-replies" list for a quick
glance/edit). Reviews of 4 stars and below get an AI-drafted suggestion that an
Admin must approve or edit before anything is posted — nothing under 5 stars
goes out without a human clicking send.

## Publishing workflow

1. Website Editor or Admin creates and submits a draft.
2. A different Website Checker or Admin approves or rejects it.
3. Approved content is published immediately or at the scheduled time.
4. Publishing invalidates the relevant Next.js cache and public route.
5. Every action is written to an immutable audit log.

Public pages never read draft or pending content. Supported content types are
exchange rates, promotions and branches.

## Quality checks

```bash
npm run lint
npm run build
```
