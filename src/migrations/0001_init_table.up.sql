CREATE TYPE gender as ENUM ('Male', 'Female', 'Other'); 
CREATE TYPE role as ENUM ('Superuser', 'Master', 'Manager', 'Worker', 'Observer'); 
CREATE TYPE batch_progress as ENUM (
'Inactive', 
'Knitting Workshop',
'Sewing Workshop',
'Molding Workshop',
'Labeling Workshop', 
'Packaging Workshop', 
'Completed'
); 

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, 
  guid TEXT UNIQUE,
  code TEXT UNIQUE, 
  code_drfo TEXT UNIQUE,
  username TEXT UNIQUE, 
  first_name TEXT NOT NULL, 
  last_name TEXT NOT NULL, 
  patronymic TEXT DEFAULT NULL, 
  full_name TEXT GENERATED ALWAYS AS (
    last_name || ' ' || first_name || 
      CASE WHEN patronymic IS NULL THEN '' ELSE ' ' || patronymic END
  ) STORED, 
  date_of_birth DATE DEFAULT NULL, 
  email TEXT DEFAULT NULL, 
  phone TEXT DEFAULT NULL, 
  gender gender NOT NULL DEFAULT 'Other', 
  departments TEXT[] DEFAULT '{}', 
  role role NOT NULL DEFAULT 'Worker'
); 

CREATE TABLE IF NOT EXISTS authentication (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, 
  hash TEXT NOT NULL, 
  salt TEXT NOT NULL
); 

CREATE TABLE IF NOT EXISTS qr_codes (
  id SERIAL PRIMARY KEY,
  name TEXT,
  resource TEXT,
  is_taken BOOLEAN GENERATED ALWAYS AS (resource IS NOT NULL) STORED
);

CREATE TABLE IF NOT EXISTS workstations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  qr_code INTEGER NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY, 
  code TEXT UNIQUE NOT NULL, 
  category TEXT DEFAULT NULL, 
  name TEXT DEFAULT NULL, 
  is_active BOOLEAN DEFAULT TRUE, 
  measure_unit TEXT DEFAULT 'Pairs'
); 

CREATE TABLE IF NOT EXISTS batches (
  id SERIAL PRIMARY KEY, 
  name TEXT DEFAULT NULL, 
  size INTEGER NOT NULL DEFAULT 100, 
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, 
  knitting_worker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  sewing_worker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  molding_worker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  labeling_worker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  packaging_worker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  workstation_id INTEGER REFERENCES workstations(id) ON DELETE CASCADE,
  progress_status batch_progress NOT NULL DEFAULT 'Inactive', 
  is_planned BOOLEAN NOT NULL DEFAULT True,
  planned_for date DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
); 

-- Functions
CREATE OR REPLACE FUNCTION set_batch_name() 
RETURNS TRIGGER AS $$ 
BEGIN 
  IF NEW.name IS NULL OR NEW.name = '' THEN 
    NEW.name := 'Batch-' || NEW.id; 
  END IF; 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql; 

CREATE OR REPLACE FUNCTION update_updated_at() 
RETURNS TRIGGER AS $$ 
BEGIN 
  NEW.updated_at := NOW(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql; 

-- Triggers
CREATE TRIGGER batches_set_name 
BEFORE INSERT ON batches 
FOR EACH ROW 
EXECUTE FUNCTION set_batch_name(); 

CREATE TRIGGER set_updated_at 
BEFORE UPDATE ON batches 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION advance_batch_progress(batch_id INTEGER)
RETURNS SETOF batches AS $$
DECLARE
  current_status batch_progress;
  new_status batch_progress;
BEGIN
  SELECT b.progress_status INTO current_status
  FROM batches b
  WHERE b.id = batch_id;

  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Batch with id % not found', batch_id;
  END IF;

  new_status := CASE current_status
    WHEN 'Inactive'           THEN 'Knitting Workshop'
    WHEN 'Knitting Workshop'  THEN 'Sewing Workshop'
    WHEN 'Sewing Workshop'    THEN 'Molding Workshop'
    WHEN 'Molding Workshop'   THEN 'Labeling Workshop'
    WHEN 'Labeling Workshop'  THEN 'Packaging Workshop'
    WHEN 'Packaging Workshop' THEN 'Completed'
    ELSE current_status
  END;

  RETURN QUERY
  UPDATE batches
  SET progress_status = new_status
  WHERE batches.id = batch_id
  RETURNING batches.*;
END;
$$ LANGUAGE plpgsql;
