create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table users (
  id uuid primary key default gen_random_uuid(),
  company_email text not null unique,
  name text not null,
  password_hash text not null,
  is_active boolean not null default true,
  password_changed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_company_email_format_chk check (position('@' in company_email) > 1)
);

create table meeting_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text null,
  description text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  meeting_room_id uuid not null references meeting_rooms(id),
  reservation_date date not null,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  purpose text null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_status_chk
    check (status in ('active', 'cancelled')),
  constraint reservations_time_order_chk
    check (end_datetime > start_datetime),
  constraint reservations_30min_boundary_chk
    check (
      extract(minute from start_datetime) in (0, 30)
      and extract(second from start_datetime) = 0
      and extract(minute from end_datetime) in (0, 30)
      and extract(second from end_datetime) = 0
    ),
  constraint reservations_min_duration_chk
    check (end_datetime - start_datetime >= interval '30 minutes'),
  constraint reservations_same_day_chk
    check (
      reservation_date = (start_datetime at time zone 'Asia/Seoul')::date
      and reservation_date = ((end_datetime - interval '1 second') at time zone 'Asia/Seoul')::date
    )
);

alter table reservations
add constraint reservations_no_overlap_excl
exclude using gist (
  meeting_room_id with =,
  tstzrange(start_datetime, end_datetime, '[)') with &&
)
where (status = 'active');

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_expiry_chk check (expires_at > created_at)
);

create index reservations_date_room_idx
  on reservations (reservation_date, meeting_room_id)
  where status = 'active';

create index reservations_user_idx
  on reservations (user_id, reservation_date desc);

create index meeting_rooms_active_sort_idx
  on meeting_rooms (is_active, sort_order, name);

create index sessions_user_idx
  on sessions (user_id);

create index sessions_expires_at_idx
  on sessions (expires_at);
