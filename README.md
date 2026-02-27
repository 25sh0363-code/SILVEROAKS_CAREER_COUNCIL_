# Career Laboratory Resource Website

Internal learning platform for **Silver Oaks Hyderabad**.  
Restricted to `@hyd.silveroaks.co.in` Google Workspace accounts.

---

## How it works

| Layer | Technology |
|-------|-----------|
| Website | `index.html` hosted on **GitHub Pages** |
| Backend | **Google Apps Script** web app — returns JSON |
| Database | **Google Sheets** — Users, Courses, Blogs tabs |
| Sign-in | **Google Identity Services** (school account, one-tap) |

Users sign in with their school Google account. The frontend sends the Google ID token on every API call. Apps Script verifies the token, checks the domain, and returns the requested data.

---

## Setup

### 1 — Google Sheet

1. Open [sheets.google.com](https://sheets.google.com) → create a new blank spreadsheet.
2. Copy the **Spreadsheet ID** from the URL:

```
https://docs.google.com/spreadsheets/d/►SPREADSHEET_ID◄/edit
```

---

### 2 — Apps Script (backend)

1. Inside the sheet → **Extensions → Apps Script**.
2. Add the following files (**+ Add file → Script** for each new one):

| File name in Apps Script | Source file |
|--------------------------|-------------|
| `Code` (default file) | `Code.gs` |
| `Auth` | `Auth.gs` |
| `SheetsDB` | `SheetsDB.gs` |
| `CoursesAPI` | `CoursesAPI.gs` |
| `BlogsAPI` | `BlogsAPI.gs` |

> Do **not** add `index.html` to Apps Script. The frontend lives on GitHub Pages.

3. In `Code.gs`, find and replace the placeholder on line ~15:

```js
SPREADSHEET_ID: "PUT_YOUR_SHEET_ID_HERE",
```

4. Select **`setupSheets`** in the function dropdown → click **Run** → approve permissions.  
   This creates the three sheet tabs with headers and sample data.

5. In the **Users** tab, set your own row to `Admin` + `Active`:

| Name | Email | Role | Status |
|------|-------|------|--------|
| Your Name | you@hyd.silveroaks.co.in | Admin | Active |

6. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** → copy the **Web App URL**.

---

### 3 — Google OAuth Client ID

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add to **Authorised JavaScript origins**:
   - `https://YOUR-USERNAME.github.io`
   - `http://localhost`
5. Click **Create** → copy the **Client ID**.

---

### 4 — Configure index.html

Open `index.html` and fill in both variables near the top of the `<script>` block:

```js
var GAS_URL   = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
var CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
```

---

### 5 — Push to GitHub & enable Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Source → GitHub Actions**.
3. Every push to `main` auto-deploys via `.github/workflows/pages.yml`.
4. Live URL: `https://YOUR-USERNAME.github.io/REPO-NAME/`

Share this link with staff and students.

---

## Roles

| Role | Can do |
|------|--------|
| Student | View published courses and blog posts |
| Editor | Create and edit courses and posts |
| Admin | Everything, including delete |

Roles are set in the **Users** sheet. First-time sign-ins are auto-added as `Student / Active`.

---

## Files

```
index.html                    Frontend — full SPA, all CSS and JS in one file
Code.gs                       API router (doGet / doPost)
Auth.gs                       Google ID token verification
SheetsDB.gs                   Sheets read/write helpers
CoursesAPI.gs                 Course logic, YouTube embed, Drive PDF download
BlogsAPI.gs                   Blog logic, tag filtering, search
appsscript.json               Apps Script manifest
.github/workflows/pages.yml   GitHub Actions auto-deploy to Pages
```
