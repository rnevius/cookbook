CREATE TABLE recipe_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  alt TEXT NOT NULL,
  media_type TEXT NOT NULL,
  contents BLOB NOT NULL
);

CREATE INDEX recipe_photos_order ON recipe_photos(recipe_id, position);
