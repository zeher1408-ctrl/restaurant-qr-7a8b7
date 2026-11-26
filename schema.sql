-- Restaurant QR ordering system schema
-- Run: psql $DATABASE_URL < schema.sql

CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  number INT UNIQUE NOT NULL,
  qr_url TEXT
);

CREATE TABLE IF NOT EXISTS dishes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL,          -- price in whole rupees
  allergens TEXT[] DEFAULT '{}',
  spice_level INT DEFAULT 0,   -- 0=mild, 1=medium, 2=hot, 3=extra-hot
  sizes TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  table_id INT REFERENCES tables(id),
  guest_name TEXT,
  guest_phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'NEW',   -- NEW | COOKING | READY | SERVED
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  dish_id INT REFERENCES dishes(id),
  dish_name TEXT NOT NULL,
  size TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price INT NOT NULL,
  total_price INT NOT NULL
);

CREATE TABLE IF NOT EXISTS calls (
  id SERIAL PRIMARY KEY,
  table_id INT REFERENCES tables(id),
  type TEXT NOT NULL,                   -- water | bill | help
  status TEXT NOT NULL DEFAULT 'NEW',   -- NEW | ON_THE_WAY | DONE
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  table_id INT REFERENCES tables(id),
  order_id INT REFERENCES orders(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Seed: 10 tables
INSERT INTO tables (number) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10)
ON CONFLICT (number) DO NOTHING;

-- Seed: sample menu
INSERT INTO dishes (name, description, price, allergens, spice_level, sizes) VALUES
  ('Chicken Karahi',   'Wok-tossed chicken in tomato & green chilli gravy', 1850, '{Dairy}', 2, '{Small,Medium,Large}'),
  ('Mutton Biryani',   'Layered basmati rice with slow-cooked mutton',      1650, '{Dairy,Nuts}', 2, '{Half,Full}'),
  ('Naan',             'Tandoor-baked flatbread',                            100,  '{Gluten,Dairy}', 0, '{}'),
  ('Raita',            'Yogurt with cucumber and mint',                      150,  '{Dairy}', 0, '{}'),
  ('Dal Makhani',      'Black lentils slow-cooked with butter and cream',    750,  '{Dairy}', 1, '{Small,Large}'),
  ('Seekh Kebab',      'Minced lamb skewers with spices',                    950,  '{}', 2, '{}'),
  ('Gulab Jamun',      'Deep-fried milk dumplings in sugar syrup',           450,  '{Dairy,Gluten,Nuts}', 0, '{}'),
  ('Mango Lassi',      'Chilled mango yogurt drink',                         350,  '{Dairy}', 0, '{}'),
  ('Peshawari Naan',   'Stuffed with coconut, raisins and nuts',             200,  '{Gluten,Dairy,Nuts}', 0, '{}'),
  ('Chicken Tikka',    'Charcoal-grilled marinated chicken pieces',          850,  '{Dairy}', 1, '{}')
ON CONFLICT DO NOTHING;
