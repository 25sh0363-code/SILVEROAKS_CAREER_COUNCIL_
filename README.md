# Silver Oaks Career Laboratory

An internal Learning Management System (LMS) for Silver Oaks International School, Hyderabad. Students browse career-focused courses and blog posts; staff manage all content through a built-in portal.

**Live site:** https://25sh0363-code.github.io/SILVEROAKS_CAREER_COUNCIL_/

---

## Features

- **School-only login** — Google OAuth restricted to `@hyd.silveroaks.co.in` accounts
- **Courses** — filterable by grade (Class 7–12) and category, with YouTube videos, PDF links, and thumbnail images
- **Blog** — articles with featured images and tags
- **Staff portal** — Admins and Editors can create, edit, and delete courses and posts
- **User management** — Admins can change user roles (Admin / Editor / Student) from the portal
- **Image upload** — Course thumbnails can be uploaded directly; images are stored in Google Drive
- **Dashboard** — charts showing course counts by category and grade

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Single-page HTML/CSS/JS (`index.html`) hosted on GitHub Pages |
| Backend | Google Apps Script (GAS) Web App |
| Database | Google Sheets (Users, Courses, Blogs tabs) |
| Auth | Google Identity Services (OAuth 2.0) |
| Storage | Google Drive (thumbnail images) |

---

## Project Structure

```
index.html              — Full frontend (one file, no build step)
Code.gs                 — GAS router: doGet / doPost endpoints
Auth.gs                 — Token verification, role enforcement
SheetsDB.gs             — Low-level Sheets read/write helpers
CoursesAPI.gs           — Course CRUD, search, grade/category filters
BlogsAPI.gs             — Blog post CRUD
appsscript.json         — GAS manifest and OAuth scopes
TRANSFER_OWNERSHIP.md   — Steps to hand the project to a new account
```

---

## Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Everything — manage courses, posts, and user roles |
| **Editor** | Create and edit courses and blog posts |
| **Student** | Read-only access to published content |

The first Admin must be added manually to the **Users** tab in the Google Sheet.

---

## Configuration

Two variables near the top of `index.html` must match your deployment:

```js
var GAS_URL   = "https://script.google.com/macros/s/<deployment-id>/exec";
var CLIENT_ID = "<your-oauth-client-id>.apps.googleusercontent.com";
```

---

## Setup Summary

1. Paste all `.gs` files into a new Google Apps Script project linked to a Google Sheet.
2. Run `setupSheets()` once to create the Users, Courses, and Blogs tabs.
3. Deploy the GAS project as a Web App (Execute as: **Me**, Access: **Anyone**).
4. Create an OAuth 2.0 Client ID in Google Cloud Console (Web application type).
5. Add the authorized JavaScript origin for your GitHub Pages URL.
6. Update `GAS_URL` and `CLIENT_ID` in `index.html`, then push to GitHub.
7. Enable GitHub Pages on the repo (branch: `main`, root folder).
8. Add the first Admin row to the Users sheet manually.

Full transfer and setup steps: see [TRANSFER_OWNERSHIP.md](TRANSFER_OWNERSHIP.md)

---

## Current Deployment

| Item | Value |
|------|-------|
| GitHub Pages | https://25sh0363-code.github.io/SILVEROAKS_CAREER_COUNCIL_/ |
| GAS Deployment ID | `AKfycbzb4VXX_hrly9ShNPQ8jtZuvhOrNmuBqQ_GejKfYLS_i6fecjyIFyxzyIXhQXbmF96a` |
| Google Sheet ID | `1nDVOm72SBdR-Nf3AfWwi5QOZP5QxCXSLu3W1QnA29w0` |
| OAuth Client ID | `392344488331-qt8b726lvhbldl9bptpj58bagj8qq2af` |