CREATE TABLE positions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  position_id INT NOT NULL,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT ON UPDATE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source VARCHAR(255) NOT NULL,
  translated VARCHAR(255) NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- После `translatePosition` в UI остаётся тот же текст, что и в `positions.name` (англ.).
-- Русские подписи требуют utf8mb4 на сервере и в клиентских драйверах — см. typeorm/mysql.ts.
INSERT INTO translations (source, translated)
VALUES
  ('officer', 'officer'),
  ('manager', 'manager'),
  ('operator', 'operator');

