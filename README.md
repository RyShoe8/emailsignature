# Email Signature

Standalone Next.js app for building and saving organization-wide HTML email signatures (ported from an internal admin tool).

## Setup

1. Copy `.env.example` to `.env.local` and set:

   - `MONGODB_URI` — MongoDB connection string (use a **dedicated database** for this app, not shared with other sites).
   - `MONGODB_DB_NAME` — optional; defaults to `emailsignature`.
   - `NEXTAUTH_SECRET` — generate a random string for production.
   - `NEXTAUTH_URL` — e.g. `http://localhost:3000` locally, or your deployed URL.

2. Install dependencies and run:

   ```bash
   npm install
   npm run dev
   ```

3. Create at least one user in MongoDB `users` collection with a **bcrypt-hashed** password and `role: "admin"` (required to save organization settings). Example using Node:

   ```js
   const bcrypt = require('bcryptjs');
   console.log(await bcrypt.hash('your-password', 10));
   ```

   Insert `{ email, password: '<hash>', role: 'admin', createdAt: new Date(), updatedAt: new Date() }`.

4. Open [http://localhost:3000](http://localhost:3000) — sign in at `/admin/login`, edit branding under **Organization signature**, save.

## Project layout

- `packages/signature-engine` — published locally as npm workspace package `emailsignature-engine` (rendering + types).
- `app/admin/signature` — admin UI.
- `app/api/admin/signature` — loads/saves org settings (`signatureSettings` collection, `scope: 'organization'`).

Replace placeholder logo URLs, social icon URLs (defaults use remote placeholders), and mock defaults after first deploy.
