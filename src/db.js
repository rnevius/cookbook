import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const migrationsPath = fileURLToPath(
  new URL('../migrations/', import.meta.url),
);

export function openDatabase(
  path = process.env.DATABASE_PATH || './data/recipes.sqlite',
) {
  if (path !== ':memory:')
    mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path);
  try {
    db.exec(
      'PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;',
    );
    db.exec(
      'CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)',
    );
    for (const name of readdirSync(migrationsPath)
      .filter((name) => /^\d+.*\.sql$/.test(name))
      .sort()) {
      const sql = readFileSync(resolve(migrationsPath, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      db.exec('BEGIN IMMEDIATE');
      try {
        const previous = db
          .prepare('SELECT checksum FROM migrations WHERE name = ?')
          .get(name);
        if (previous && previous.checksum !== checksum)
          throw new Error(`Applied migration changed: ${name}`);
        if (!previous) {
          db.exec(sql);
          db.prepare(
            'INSERT INTO migrations (name, checksum) VALUES (?, ?)',
          ).run(name, checksum);
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    }
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

function fromRow(row) {
  return row
    ? {
        categories: [],
        ...JSON.parse(row.document),
        photos: JSON.parse(row.photos),
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;
}

export function recipeStore(db) {
  const get = (id) =>
    fromRow(
      db
        .prepare(
          `
        SELECT recipes.*, (
          SELECT json_group_array(json_object('id', id, 'alt', alt) ORDER BY position)
          FROM recipe_photos WHERE recipe_id = recipes.id
        ) AS photos FROM recipes WHERE id = ?
      `,
        )
        .get(id),
    );

  function savePhotos(recipeId, photos) {
    const add = db.prepare(
      'INSERT INTO recipe_photos (recipe_id, position, alt, media_type, contents) VALUES (?, ?, ?, ?, ?)',
    );
    const update = db.prepare(
      'UPDATE recipe_photos SET position = ?, alt = coalesce(?, alt) WHERE recipe_id = ? AND id = ?',
    );
    const ids = new Set();
    for (const [position, photo] of photos.entries()) {
      if (photo.id === undefined) {
        const result = add.run(
          recipeId,
          position,
          photo.alt ?? '',
          photo.type,
          photo.contents,
        );
        ids.add(Number(result.lastInsertRowid));
      } else {
        if (
          ids.has(photo.id) ||
          !update.run(position, photo.alt ?? null, recipeId, photo.id).changes
        )
          throw Object.assign(
            new Error(
              'Each saved photo must belong to this recipe and appear only once.',
            ),
            { statusCode: 400 },
          );
        ids.add(photo.id);
      }
    }
    db.prepare(
      'DELETE FROM recipe_photos WHERE recipe_id = ? AND id NOT IN (SELECT value FROM json_each(?))',
    ).run(recipeId, JSON.stringify([...ids]));
  }

  function save({ photos, ...recipe }, id) {
    const title = recipe.title.trim();
    const document = JSON.stringify({ ...recipe, title });
    db.exec('BEGIN IMMEDIATE');
    try {
      if (id === undefined) {
        const result = db
          .prepare('INSERT INTO recipes (title, document) VALUES (?, ?)')
          .run(title, document);
        id = Number(result.lastInsertRowid);
      } else {
        const result = db
          .prepare(
            "UPDATE recipes SET title = ?, document = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
          )
          .run(title, document, id);
        if (!result.changes) {
          throw Object.assign(new Error('Recipe not found.'), {
            statusCode: 404,
          });
        }
      }
      if (photos !== undefined) savePhotos(id, photos);
      const saved = get(id);
      db.exec('COMMIT');
      return saved;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  return {
    list() {
      return db
        .prepare(
          'SELECT id, title, updated_at AS updatedAt FROM recipes ORDER BY title COLLATE NOCASE, id',
        )
        .all();
    },
    get,
    photo(recipeId, photoId) {
      return db
        .prepare(
          'SELECT media_type AS type, contents FROM recipe_photos WHERE recipe_id = ? AND id = ?',
        )
        .get(recipeId, photoId);
    },
    create(recipe) {
      return save(recipe);
    },
    update(id, recipe) {
      return save(recipe, id);
    },
    references(id) {
      return db
        .prepare(
          `SELECT DISTINCT recipes.id, recipes.title FROM recipes, json_each(recipes.document, '$.groups') AS groups, json_each(groups.value, '$.ingredients') AS ingredients WHERE json_extract(ingredients.value, '$.componentId') = ?`,
        )
        .all(id);
    },
    delete(id) {
      return db.prepare('DELETE FROM recipes WHERE id = ?').run(id).changes > 0;
    },
  };
}
