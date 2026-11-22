import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../scripts/seed.js';

test('seeding creates the recipes and preserves existing edits on subsequent runs', async (t) => {
  const app = createApp({ databasePath: ':memory:' });
  t.after(() => app.close());
  const first = await seedDatabase(app);
  assert.equal(first.created.length, 3);
  const arancini = first.created.find((recipe) => recipe.title === 'Arancini');
  const { id, createdAt, updatedAt, ...edited } = arancini;
  edited.title = 'ARANCINI';
  edited.notes = 'My own kitchen notes.';
  edited.groups[0].ingredients[0].quantity = '2';
  const updated = await app.inject({
    method: 'PUT',
    url: `/api/recipes/${id}`,
    payload: edited,
  });
  assert.equal(updated.statusCode, 200);
  const second = await seedDatabase(app);
  assert.equal(second.created.length, 0);
  assert.equal(second.skipped.length, 3);
  assert.equal((await app.inject('/api/recipes')).json().length, 3);
  assert.deepEqual(
    (await app.inject(`/api/recipes/${id}`)).json(),
    updated.json(),
  );
});

test('seeded arancini scales its water, split cheese, peas, and yield without scaling frying fat', async (t) => {
  const app = createApp({ databasePath: ':memory:' });
  t.after(() => app.close());
  const { created } = await seedDatabase(app);
  const arancini = created.find((recipe) => recipe.title === 'Arancini');
  const response = await app.inject(`/recipes/${arancini.id}?scale=2`);
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /Yields 64 arancini/);
  for (const amount of ['4 L', '100 g', '300 g', '2 cups', 'as needed'])
    assert.ok(response.body.includes(`<td>${amount}</td>`), amount);
  assert.match(response.body, /data-ingredient-note>Or more/);
  assert.doesNotMatch(response.body, /<th scope="col">Scaling/);
  const bagels = created.find((recipe) => recipe.title === 'Bagels (yeasted)');
  const doubled = await app.inject(`/recipes/${bagels.id}?scale=2`);
  assert.match(doubled.body, /111 g pieces/);
  assert.match(doubled.body, /30 g malt syrup per liter/);
  assert.match(doubled.body, /<td>908 g<\/td>/);
});

test('seeds pass through recipe validation before being saved', async (t) => {
  const app = createApp({ databasePath: ':memory:' });
  t.after(() => app.close());
  await assert.rejects(
    seedDatabase(app, [{ title: 'Invalid recipe', groups: [] }]),
    /Unable to seed Invalid recipe/,
  );
  assert.deepEqual((await app.inject('/api/recipes')).json(), []);
});
