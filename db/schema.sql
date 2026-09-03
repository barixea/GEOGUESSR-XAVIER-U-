create table if not exists building_photos (
  building_id   text primary key,
  blob_url      text not null,
  blob_pathname text not null,
  caption       text,
  uploaded_by   text,
  updated_at    timestamptz not null default now()
);
