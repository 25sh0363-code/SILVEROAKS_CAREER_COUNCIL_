# Supabase Setup

This project now talks directly to Supabase from the browser. There is no Apps Script backend in the active path.

## 1. Create the database tables

Run the SQL below in the Supabase SQL editor.

```sql


```

## 2. Create a public storage bucket

Create a bucket named `career-lab-uploads` and make it public. The app uploads thumbnails and PDFs there directly from the browser.

## 3. Configure the frontend

Open `index.html` and replace these placeholders:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_STORAGE_BUCKET` (default: `career-lab-uploads`)

The anon key is the only key the browser needs. Do not put the service role key in the frontend.

## 4. Set permissions

This build assumes your Supabase tables and storage bucket are accessible to the browser through the anon key. If you want stricter security, switch the app to Supabase Auth and add RLS policies before exposing it publicly.

For an internal-only deployment, the quickest path is permissive policies like these:

```sql
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.blogs enable row level security;
alter table public.reference_materials enable row level security;
alter table public.career_labs enable row level security;

create policy "public read users" on public.users for select using (true);
create policy "public write users" on public.users for insert with check (true);
create policy "public update users" on public.users for update using (true) with check (true);
create policy "public delete users" on public.users for delete using (true);

create policy "public read courses" on public.courses for select using (true);
create policy "public write courses" on public.courses for insert with check (true);
create policy "public update courses" on public.courses for update using (true) with check (true);
create policy "public delete courses" on public.courses for delete using (true);

create policy "public read blogs" on public.blogs for select using (true);
create policy "public write blogs" on public.blogs for insert with check (true);
create policy "public update blogs" on public.blogs for update using (true) with check (true);
create policy "public delete blogs" on public.blogs for delete using (true);

create policy "public read references" on public.reference_materials for select using (true);
create policy "public write references" on public.reference_materials for insert with check (true);
create policy "public update references" on public.reference_materials for update using (true) with check (true);
create policy "public delete references" on public.reference_materials for delete using (true);

create policy "public read career labs" on public.career_labs for select using (true);
create policy "public write career labs" on public.career_labs for insert with check (true);
create policy "public update career labs" on public.career_labs for update using (true) with check (true);
create policy "public delete career labs" on public.career_labs for delete using (true);

alter table storage.objects enable row level security;
create policy "public read uploads" on storage.objects for select using (bucket_id = 'career-lab-uploads');
create policy "public write uploads" on storage.objects for insert with check (bucket_id = 'career-lab-uploads');
create policy "public update uploads" on storage.objects for update using (bucket_id = 'career-lab-uploads') with check (bucket_id = 'career-lab-uploads');
create policy "public delete uploads" on storage.objects for delete using (bucket_id = 'career-lab-uploads');
```

## 5. Seed data

Seed the tables once after they exist. The app’s first-run flow will create the current user row automatically; you can also insert the sample rows from this file manually.
