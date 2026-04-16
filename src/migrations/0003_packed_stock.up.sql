CREATE TABLE packed_stock (
  id         SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) UNIQUE,
  quantity   INT NOT NULL DEFAULT 0 CHECK (quantity >= 0)
);
