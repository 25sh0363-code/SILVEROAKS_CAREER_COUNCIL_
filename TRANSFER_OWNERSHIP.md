# Transferring Ownership — Silver Oaks Career Laboratory

Follow these steps to hand the project over to a new Google/GitHub account.

---

## 1. Supabase

1. Open the Supabase project that stores the app data.
2. Make sure the tables and storage bucket described in [SUPABASE_SETUP.md](SUPABASE_SETUP.md) exist.
3. If the new owner uses a different Supabase project, update `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `index.html`.

---

## 2. Google Cloud OAuth (Client ID)

The OAuth Client ID is tied to the Google Cloud project of the original account.

1. Sign in to the **new account** at `https://console.cloud.google.com`.
2. Create a new project (or use an existing one).
3. Go to **APIs & Services → OAuth consent screen**:
   - App name: `Career Laboratory`
   - User support email: new owner's email
   - Authorized domain: `github.io`
   - Publishing status: **In production**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `https://25sh0363-code.github.io` (or the new GitHub Pages URL)
5. Copy the new **Client ID**.
6. In `index.html`, replace the current `CLIENT_ID` value.

---

## 3. GitHub Repository

### Option A — Transfer the repository
1. Go to the repo: `https://github.com/25sh0363-code/SILVEROAKS_CAREER_COUNCIL_`
2. **Settings → General → Danger Zone → Transfer ownership**.
3. Enter the new owner's GitHub username → confirm.
4. The new owner accepts the transfer from their GitHub notifications.
5. GitHub Pages will continue working; the URL may change if the username changes:  
   `https://<new-username>.github.io/SILVEROAKS_CAREER_COUNCIL_/`

### Option B — Fork / re-upload to new account
1. The new owner forks the repo, or you push the local folder to a new repo under their account.
2. Enable **Pages** on the new repo: Settings → Pages → Branch: `main` / `root`.

---

## 4. Update `index.html` After Transfer

After steps 1–3, update these lines in `index.html`:

```js
var SUPABASE_URL = "PASTE_NEW_SUPABASE_URL_HERE";
var SUPABASE_ANON_KEY = "PASTE_NEW_SUPABASE_ANON_KEY_HERE";
var CLIENT_ID = "PASTE_NEW_OAUTH_CLIENT_ID_HERE";
```

Then commit and push:

```bash
git add index.html
git commit -m "update Supabase and OAuth settings for new owner"
git push
```

---

## 5. Set the First Admin

After the site is live under the new account:

1. Open Supabase and look at the `users` table.
2. Find the new owner's school email row after their first sign-in, or add one manually:

   | Email | Role | DisplayName | CreatedDate |
   |-------|------|-------------|-------------|
   | newowner@hyd.silveroaks.co.in | Admin | Name | 2026-02-27 |

3. Only **Admin** accounts can manage courses, blogs, and user roles from the staff portal.

---

## 6. Uploads

Uploaded thumbnails and PDFs are stored in the Supabase Storage bucket described in [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

---

## Current Configuration (for reference)

| Item | Value |
|------|-------|
| OAuth Client ID | `392344488331-qt8b726lvhbldl9bptpj58bagj8qq2af.apps.googleusercontent.com` |
| Supabase tables | `public.users`, `public.courses`, `public.blogs`, `public.reference_materials`, `public.career_labs` |
| GitHub Pages | `https://25sh0363-code.github.io/SILVEROAKS_CAREER_COUNCIL_/` |
