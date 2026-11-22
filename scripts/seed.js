import { pathToFileURL } from 'node:url';
import { createApp } from '../src/app.js';
import { seedRecipes } from './seed-data.js';

// Use the API so seeds obey the same validation as recipes saved in the editor.
export async function seedDatabase(app, recipes = seedRecipes) {
  const existing = (await app.inject('/api/recipes')).json();
  const titles = new Set(existing.map((recipe) => recipe.title.toLowerCase()));
  const result = { created: [], skipped: [] };
  for (const recipe of recipes) {
    const title = recipe.title.trim();
    if (titles.has(title.toLowerCase())) {
      result.skipped.push(title);
      continue;
    }
    const response = await app.inject({
      method: 'POST',
      url: '/api/recipes',
      payload: recipe,
    });
    if (response.statusCode !== 201)
      throw new Error(`Unable to seed ${title}: ${response.json().message}`);
    result.created.push(response.json());
    titles.add(title.toLowerCase());
  }
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const app = createApp();
  try {
    const result = await seedDatabase(app);
    for (const recipe of result.created)
      console.log(`Created ${recipe.title}: /recipes/${recipe.id}`);
    for (const title of result.skipped)
      console.log(`Skipped existing recipe: ${title}`);
  } finally {
    await app.close();
  }
}
