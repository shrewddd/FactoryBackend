ALTER TABLE defects
DROP CONSTRAINT defects_batch_id_fkey,
ADD CONSTRAINT defects_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE;
