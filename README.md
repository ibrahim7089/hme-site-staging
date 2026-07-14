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
