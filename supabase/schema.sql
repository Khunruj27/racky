-- Ciiya core stability schema patch

alter table photos
add column if not exists original_size_bytes bigint default 0,
add column if not exists preview_size_bytes bigint default 0,
add column if not exists thumbnail_size_bytes bigint default 0,
add column if not exists preview_path text,
add column if not exists preview_url text,
add column if not exists thumbnail_path text,
add column if not exists thumbnail_url text,
add column if not exists original_path text,
add column if not exists processing_status text default 'pending',
add column if not exists processing_progress integer default 0;

alter table photo_jobs
add column if not exists started_at timestamptz,
add column if not exists finished_at timestamptz,
add column if not exists error text;

create index if not exists photos_owner_id_idx
on photos(owner_id);

create index if not exists photos_album_id_idx
on photos(album_id);

create index if not exists photo_jobs_status_created_at_idx
on photo_jobs(status, created_at);

create index if not exists photo_jobs_photo_id_idx
on photo_jobs(photo_id);

create table if not exists worker_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid,
  photo_id uuid,
  owner_id uuid,
  album_id uuid,
  level text not null default 'error',
  message text not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists worker_logs_created_at_idx
on worker_logs(created_at desc);

create index if not exists worker_logs_job_id_idx
on worker_logs(job_id);

create index if not exists worker_logs_photo_id_idx
on worker_logs(photo_id);

create table if not exists system_locks (
  key text primary key,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table photo_jobs
add column if not exists retry_count integer default 0;

alter table photo_jobs
add column if not exists priority integer default 100;

create index if not exists photo_jobs_priority_created_at_idx
on photo_jobs(priority asc, created_at asc);

alter table photo_jobs
add column if not exists cancelled_at timestamptz;

create index if not exists photo_jobs_cancelled_at_idx
on photo_jobs(cancelled_at);

-- Face scan production columns

alter table photos
add column if not exists face_scan_status text default 'pending',
add column if not exists face_scan_progress integer default 0,
add column if not exists face_scan_error text,
add column if not exists faces_count integer default 0;

-- Multi size outputs

alter table photos
add column if not exists sd_path text,
add column if not exists hd_path text,
add column if not exists uhd_path text,
add column if not exists sd_url text,
add column if not exists hd_url text,
add column if not exists uhd_url text,
add column if not exists selected_size text default 'hd';

-- Face descriptor table

create table if not exists photo_faces (
  id uuid primary key default gen_random_uuid(),

  photo_id uuid not null references photos(id) on delete cascade,
  album_id uuid not null,
  owner_id uuid,

  face_index integer default 0,

  box_x double precision,
  box_y double precision,
  box_width double precision,
  box_height double precision,

  descriptor jsonb not null,

  person_cluster_id uuid,

  created_at timestamptz default now()
);

create index if not exists photo_faces_photo_id_idx
on photo_faces(photo_id);

create index if not exists photo_faces_album_id_idx
on photo_faces(album_id);

create index if not exists photo_faces_created_at_idx
on photo_faces(created_at desc);

-- Better production indexes

create index if not exists photos_album_done_created_idx
on photos(album_id, processing_status, created_at desc);

create index if not exists photo_faces_album_created_idx
on photo_faces(album_id, created_at desc);

create index if not exists albums_share_token_idx
on albums(share_token);

-- View counters

alter table photos
add column if not exists view_count bigint default 0;

alter table albums
add column if not exists view_count bigint default 0;

-- Realtime optimization

alter publication supabase_realtime add table photos;
alter publication supabase_realtime add table albums;

-- Storage tracking

alter table photos
add column if not exists file_size_bytes bigint default 0;

-- Safety defaults

alter table photos
alter column processing_progress set default 0;

alter table photos
alter column face_scan_progress set default 0;

-- Useful queue filters

create index if not exists photos_processing_status_idx
on photos(processing_status);

create index if not exists photos_face_scan_status_idx
on photos(face_scan_status);

create index if not exists photo_jobs_status_priority_idx
on photo_jobs(status, priority, created_at);