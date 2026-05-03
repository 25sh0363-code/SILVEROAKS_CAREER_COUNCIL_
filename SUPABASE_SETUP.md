# Supabase Setup

This project now talks directly to Supabase from the browser. There is no Apps Script backend in the active path.

## 1. Create the database tables

Run the SQL below in the Supabase SQL editor.

```sql
create table if not exists public.users (
  id text primary key,
  name text not null default '',
  email text not null unique,
  role text not null default 'Student',
  status text not null default 'Active',
  created_date timestamptz not null default now()
);

create table if not exists public.courses (
  id text primary key,
  title text not null default '',
  description text not null default '',
  instructor text not null default '',
  category text not null default '',
  grade text not null default '',
  thumbnail_url text not null default '',
  youtube_url text not null default '',
  pdf_link text not null default '',
  content text not null default '',
  status text not null default 'Draft',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.blogs (
  id text primary key,
  title text not null default '',
  content text not null default '',
  featured_image_url text not null default '',
  pdf_link text not null default '',
  author_email text not null default '',
  tags text not null default '',
  status text not null default 'Draft',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.reference_materials (
  id text primary key,
  title text not null default '',
  description text not null default '',
  author text not null default '',
  category text not null default '',
  thumbnail_url text not null default '',
  youtube_url text not null default '',
  pdf_link text not null default '',
  content text not null default '',
  status text not null default 'Draft',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.career_labs (
  id text primary key,
  title text not null default '',
  student text not null default '',
  description text not null default '',
  mentor text not null default '',
  category text not null default '',
  thumbnail_url text not null default '',
  youtube_url text not null default '',
  pdf_link text not null default '',
  content text not null default '',
  status text not null default 'Draft',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
```

## 2. Create a public storage bucket

Create a bucket named `career-lab-uploads` and make it public. The app uploads thumbnails and PDFs there directly from the browser.

## 2.1 Permanent deletion behavior

Staff delete actions now perform hard deletion:

- Deleting a course/blog/reference/career lab row removes the database row and attempts to remove all bucket attachments referenced by that row.
- Deleting a user removes the user row and their authored blog rows, including related bucket attachments.

Because these are permanent deletes, there is no restore flow in the UI.

## 3. Configure the frontend

Open `index.html` and replace these placeholders:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

The anon key is the only key the browser needs. Do not put the service role key in the frontend.

Main page entry files:

- `index.html` (home)
- `courses.html`
- `blog.html`
- `references.html`
- `career-lab.html`
- `staff.html`

## 4. Set permissions

This build assumes your Supabase tables and storage bucket are accessible to the browser through the anon key. If you want stricter security, switch the app to Supabase Auth and add RLS policies before exposing it publicly.

## 5. Seed data

Seed the tables once after they exist. The app’s first-run flow will create the current user row automatically; you can also insert the sample rows from this file manually.
