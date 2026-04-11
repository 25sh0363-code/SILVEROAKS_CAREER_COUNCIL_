# Silver Oaks Career Laboratory

An internal learning platform for Silver Oaks International School, Hyderabad. Students browse career-focused courses, blog posts, references, and Career Laboratory research entries; staff manage all content through a built-in portal.

**Live site:** https://25sh0363-code.github.io/SILVEROAKS_CAREER_COUNCIL_/

## Features

- **School-only login** — Google OAuth restricted to `@hyd.silveroaks.co.in` accounts
- **Courses** — filterable by grade (Class 7–12) and category, with YouTube videos, PDF links, and thumbnail images
- **Blog** — articles with featured images, tags, and optional PDF attachments
- **References** — supplemental materials with thumbnails, videos, and PDFs
- **Career Laboratory** — student research entries with thumbnails, optional unlisted YouTube videos, and downloadable PDFs
- **Staff portal** — Admins can create, edit, and delete courses, posts, references, and Career Lab entries
- **User management** — Admins can change user roles (Admin / Editor / Student) from the portal
- **File upload** — Images and PDFs can be uploaded directly from editor forms and are stored in Google Drive
- **Dashboard** — charts showing content counts by category and grade

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Single-page HTML/CSS/JS (`index.html`) hosted on GitHub Pages |
| Backend | Google Apps Script (GAS) Web App |
| Database | Google Sheets (Users, Courses, Blogs, References, CareerLabs tabs) |
| Auth | Google Identity Services (OAuth 2.0) |
| Storage | Google Drive (uploaded images and PDFs) |

## Project Structure

```
index.html              — Full frontend (one file, no build step)
Code.gs                 — GAS router: doGet / doPost endpoints
Auth.gs                 — Token verification, role enforcement
SheetsDB.gs             — Low-level Sheets read/write helpers
CoursesAPI.gs           — Course CRUD, search, grade/category filters
BlogsAPI.gs             — Blog post CRUD
ReferencesAPI.gs        — Reference CRUD
CareerLabsAPI.gs        — Career Laboratory CRUD
appsscript.json         — GAS manifest and OAuth scopes
TRANSFER_OWNERSHIP.md   — Steps to hand the project to a new account
```

## Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Everything — manage content and user roles |
| **Editor** | Create and edit courses, blog posts, references, and career labs |
| **Student** | Read-only access to published content |

The first Admin must be added manually to the **Users** tab in the Google Sheet.

## Configuration

Two variables near the top of `index.html` must match your deployment:

```js
var GAS_URL   = "https://script.google.com/macros/s/<deployment-id>/exec";
var CLIENT_ID = "<your-oauth-client-id>.apps.googleusercontent.com";
```

## Setup Summary

1. Paste all `.gs` files into a new Google Apps Script project linked to a Google Sheet.
2. Run `setupSheets()` once to create or migrate the Users, Courses, Blogs, References, and CareerLabs tabs.
3. Deploy the GAS project as a Web App (Execute as: **Me**, Access: **Anyone**).
4. Create an OAuth 2.0 Client ID in Google Cloud Console (Web application type).
5. Add the authorized JavaScript origin for your GitHub Pages URL.
6. Update `GAS_URL` and `CLIENT_ID` in `index.html`, then push to GitHub.
7. Enable GitHub Pages on the repo (branch: `main`, root folder).
8. Add the first Admin row to the Users sheet manually.

Uploaded images and PDFs are saved in a Drive folder called `CareerLab Uploads`.

Full transfer and setup steps: see [TRANSFER_OWNERSHIP.md](TRANSFER_OWNERSHIP.md)

## Current Deployment

| Item | Value |
|------|-------|
| GitHub Pages | https://25sh0363-code.github.io/SILVEROAKS_CAREER_COUNCIL_/ |
| GAS Deployment ID | `AKfycbzNZG0i3UcWjUgD4aW3sFwIFVyR939dOSliZqiNyCKt5NEKV_FiNvlVxlO2LKZYVC2S` |
| Google Sheet ID | `1nDVOm72SBdR-Nf3AfWwi5QOZP5QxCXSLu3W1QnA29w0` |
| OAuth Client ID | `392344488331-qt8b726lvhbldl9bptpj58bagj8qq2af` |
