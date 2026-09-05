create table if not exists building_photos (
  building_id   text primary key,
  blob_url      text not null,
  blob_pathname text not null,
  caption       text,
  uploaded_by   text,
  updated_at    timestamptz not null default now()
);

create table if not exists campus_locations (
  id            text primary key,
  name          text not null,
  aliases       text[] not null default '{}',
  category      text not null,
  longitude     double precision not null,
  latitude      double precision not null,
  description   text,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists campus_locations_name_idx on campus_locations (name);

-- Per-location game participation. This table intentionally has no foreign key
-- because it can also store settings for built-in locations from data/buildings.ts.
create table if not exists campus_location_settings (
  location_id   text primary key,
  enabled       boolean not null default true,
  updated_at    timestamptz not null default now()
);
