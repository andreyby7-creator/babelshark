CREATE TABLE positions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  position_id INT NOT NULL,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source VARCHAR(255) NOT NULL,
  translated VARCHAR(255) NOT NULL
);

CREATE INDEX idx_translation_source ON translations(source);

INSERT INTO positions (name)
VALUES
  ('officer'),
  ('manager'),
  ('operator');

INSERT INTO customers (full_name, position_id)
VALUES
  ('Dino Fabrello', 1),
  ('Walter Marangoni', 2),
  ('Angelo Ottogialli', 3);

INSERT INTO translations (source, translated)
VALUES
  ('officer', 'офицер'),
  ('manager', 'менеджер'),
  ('operator', 'оператор');

