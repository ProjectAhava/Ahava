-- Ahava Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Study rooms
create table if not exists public.study_rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  passage_reference text,
  is_public boolean default true not null,
  member_count integer default 1 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.study_rooms enable row level security;

create policy "Public rooms viewable by everyone"
  on public.study_rooms for select using (is_public = true or auth.uid() = owner_id);

create policy "Authenticated users can create rooms"
  on public.study_rooms for insert with check (auth.uid() = owner_id);

create policy "Room owners can update their rooms"
  on public.study_rooms for update using (auth.uid() = owner_id);

create policy "Room owners can delete their rooms"
  on public.study_rooms for delete using (auth.uid() = owner_id);

-- Room members
create table if not exists public.room_members (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.study_rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now() not null,
  unique(room_id, user_id)
);

alter table public.room_members enable row level security;

create policy "Room members viewable by everyone"
  on public.room_members for select using (true);

create policy "Users can join rooms"
  on public.room_members for insert with check (auth.uid() = user_id);

create policy "Users can leave rooms"
  on public.room_members for delete using (auth.uid() = user_id);

-- Shared notes
create table if not exists public.shared_notes (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.study_rooms(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book text not null,
  chapter integer not null,
  verse integer not null,
  verse_end integer,
  content text not null,
  is_public boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.shared_notes enable row level security;

create policy "Public notes viewable by everyone"
  on public.shared_notes for select using (is_public = true or auth.uid() = user_id);

create policy "Users can create notes"
  on public.shared_notes for insert with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.shared_notes for update using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.shared_notes for delete using (auth.uid() = user_id);

-- Bookmarks
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book text not null,
  chapter integer not null,
  verse integer not null,
  label text,
  color text,
  created_at timestamptz default now() not null,
  unique(user_id, book, chapter, verse)
);

alter table public.bookmarks enable row level security;

create policy "Users can view their own bookmarks"
  on public.bookmarks for select using (auth.uid() = user_id);

create policy "Users can create bookmarks"
  on public.bookmarks for insert with check (auth.uid() = user_id);

create policy "Users can update their bookmarks"
  on public.bookmarks for update using (auth.uid() = user_id);

create policy "Users can delete their bookmarks"
  on public.bookmarks for delete using (auth.uid() = user_id);

-- Highlights
create table if not exists public.highlights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book text not null,
  chapter integer not null,
  verse integer not null,
  color text not null,
  created_at timestamptz default now() not null,
  unique(user_id, book, chapter, verse)
);

alter table public.highlights enable row level security;

create policy "Users can view their own highlights"
  on public.highlights for select using (auth.uid() = user_id);

create policy "Users can create highlights"
  on public.highlights for insert with check (auth.uid() = user_id);

create policy "Users can update their highlights"
  on public.highlights for update using (auth.uid() = user_id);

create policy "Users can delete their highlights"
  on public.highlights for delete using (auth.uid() = user_id);

-- Chat messages
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.study_rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.chat_messages enable row level security;

create policy "Chat messages viewable by everyone"
  on public.chat_messages for select using (true);

create policy "Authenticated users can send messages"
  on public.chat_messages for insert with check (auth.uid() = user_id);

-- Enable realtime on chat messages and shared notes
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.shared_notes;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
