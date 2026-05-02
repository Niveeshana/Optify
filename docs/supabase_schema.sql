-- ============================================================
-- GlaucomaAI — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text not null default 'patient' check (role in ('patient', 'doctor', 'admin')),
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Doctors and admins can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('doctor', 'admin')
    )
  );

-- ============================================================
-- DIAGNOSES TABLE
-- ============================================================
create table public.diagnoses (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  image_url text,                         -- Supabase storage URL
  prediction text check (prediction in ('GON+', 'GON-')),
  confidence float check (confidence >= 0 and confidence <= 1),
  gradcam_url text,                       -- Grad-CAM heatmap URL
  notes text,                             -- Doctor notes
  reviewed_by uuid references public.profiles(id), -- Doctor who reviewed
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table public.diagnoses enable row level security;
create policy "Patients can view own diagnoses" on public.diagnoses
  for select using (auth.uid() = patient_id);
create policy "Patients can insert own diagnoses" on public.diagnoses
  for insert with check (auth.uid() = patient_id);
create policy "Doctors and admins can view all diagnoses" on public.diagnoses
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('doctor', 'admin')
    )
  );
create policy "Doctors can update diagnoses" on public.diagnoses
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('doctor', 'admin')
    )
  );

-- ============================================================
-- CHAT MESSAGES TABLE (for chatbot history)
-- ============================================================
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  sources jsonb,                          -- RAG source citations
  created_at timestamptz default now()
);

-- RLS
alter table public.chat_messages enable row level security;
create policy "Users can view own chat history" on public.chat_messages
  for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on public.chat_messages
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SEED: Demo Users (run AFTER creating users via Supabase Auth UI
-- or the seed script; this just sets roles)
-- ============================================================
-- You can manually update roles here after creating accounts:
-- UPDATE public.profiles SET role = 'doctor' WHERE email = 'doctor@demo.com';
-- UPDATE public.profiles SET role = 'admin'  WHERE email = 'admin@demo.com';
