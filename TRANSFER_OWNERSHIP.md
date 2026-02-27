# Transferring Ownership — Silver Oaks Career Laboratory

Follow these steps to hand the project over to a new Google/GitHub account.

---

## 1. Google Sheet

1. Open the spreadsheet at:  
   `https://docs.google.com/spreadsheets/d/1nDVOm72SBdR-Nf3AfWwi5QOZP5QxCXSLu3W1QnA29w0`
2. Click **Share** (top-right).
3. Add the new owner's Gmail → set role to **Editor**.
4. Click **Share**, then open **Share** again.
5. Next to their name, click the role dropdown → **Transfer ownership** → confirm.
6. The new owner must accept the ownership transfer from their email.

---

## 2. Google Apps Script (GAS)

The Apps Script project is tied to the Google account that created it. The cleanest way to transfer it is to copy it into the new account:

1. In the current account, open Apps Script:  
   `https://script.google.com`
2. Open the **SILVEROAKS_CAREER_COUNCIL_** project.
3. For each file (`Code.gs`, `Auth.gs`, `SheetsDB.gs`, `CoursesAPI.gs`, `BlogsAPI.gs`, `appsscript.json`), copy the full contents.
4. Sign in to the **new account** and create a new Apps Script project.
5. Paste each file's contents into matching files in the new project.
6. Update `SPREADSHEET_ID` in `Code.gs` if the sheet was also transferred (it stays the same if the sheet ID didn't change).
7. Click **Deploy → New deployment** → type **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Copy the new deployment URL.
9. Update `GAS_URL` in `index.html` with the new URL (see step 5 below).

> **Alternative**: Add the new account as a co-owner in Apps Script via **Share** in the editor, then have them create a new deployment from their account.

---

## 3. Google Cloud OAuth (Client ID)

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
6. In `index.html`, find:
   ```js
   var CLIENT_ID = "392344488331-...";
   ```
   Replace it with the new Client ID.

---

## 4. GitHub Repository

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

## 5. Update index.html After Transfer

After steps 2–4, update these two lines in `index.html`:

```js
var GAS_URL   = "PASTE_NEW_GAS_DEPLOYMENT_URL_HERE";
var CLIENT_ID = "PASTE_NEW_OAUTH_CLIENT_ID_HERE";
```

Then commit and push:

```bash
git add index.html
git commit -m "update GAS URL and CLIENT_ID for new owner"
git push
```

---

## 6. Set the First Admin

After the site is live under the new account:

1. Open the Google Sheet → **Users** tab.
2. Find the new owner's school email row (it appears after their first sign-in), or add a row manually:

   | Email | Role | DisplayName | CreatedDate |
   |-------|------|-------------|-------------|
   | newowner@hyd.silveroaks.co.in | Admin | Name | 2026-02-27 |

3. Only **Admin** accounts can manage courses, blogs, and user roles from the staff portal.

---

## 7. Google Drive (Thumbnails Folder)

Uploaded course thumbnails are stored in a folder called **CareerLab Thumbnails** in the Drive of whichever Google account runs the Apps Script.  
After transferring GAS to the new account, new uploads will go to the new account's Drive automatically. Old thumbnails may break — to fix them, re-upload images from the course edit form.

---

## Current Configuration (for reference)

| Item | Value |
|------|-------|
| GAS URL | `https://script.google.com/macros/s/AKfycbzb4VXX_hrly9ShNPQ8jtZuvhOrNmuBqQ_GejKfYLS_i6fecjyIFyxzyIXhQXbmF96a/exec` |
| OAuth Client ID | `392344488331-qt8b726lvhbldl9bptpj58bagj8qq2af.apps.googleusercontent.com` |
| Sheet ID | `1nDVOm72SBdR-Nf3AfWwi5QOZP5QxCXSLu3W1QnA29w0` |
| GitHub Pages | `https://25sh0363-code.github.io/SILVEROAKS_CAREER_COUNCIL_/` |
