CREATE TABLE sites (
  id serial PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE devices (
  id serial PRIMARY KEY,
  site_id integer NOT NULL REFERENCES sites (id),
  name text NOT NULL
);

CREATE TABLE readings (
  id serial PRIMARY KEY,
  device_id integer NOT NULL REFERENCES devices (id),
  value numeric NOT NULL,
  recorded_at timestamptz NOT NULL
);

CREATE INDEX devices_site_id_idx ON devices (site_id);
CREATE INDEX readings_device_id_idx ON readings (device_id);
