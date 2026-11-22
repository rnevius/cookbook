import { test, expect } from '@playwright/test';
import { seedRecipes } from '../../scripts/seed-data.js';

test('author, reorder, scale, edit, and delete a recipe', async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'New recipe', exact: true }).click();
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.getByLabel('Recipe title').fill('Brown butter sauce');
  await page.getByLabel('Finished yield').fill('250 g');
  await page.getByRole('checkbox', { name: 'Sides', exact: true }).check();
  await page
    .getByRole('checkbox', { name: 'Pantry staples', exact: true })
    .check();
  let stage = page.locator('[data-group]').first();
  await stage.getByLabel('Stage name').fill('Brown the butter');
  let item = stage.locator('[data-ingredient]').first();
  await item.getByLabel('Ingredient', { exact: true }).fill('Butter');
  await item.getByLabel('Quantity', { exact: true }).fill('200');
  await item.getByText('Options', { exact: true }).click();
  await item
    .getByLabel('Ingredient notes', { exact: true })
    .fill('Unsalted, cubed');
  await stage
    .getByLabel('Step 1', { exact: true })
    .fill('Heat at 150 °C for 5–6 minutes until golden.');
  await stage
    .getByRole('button', { name: 'Add ingredient', exact: true })
    .click();
  item = stage.locator('[data-ingredient]').last();
  await item.getByLabel('Ingredient', { exact: true }).fill('Lemon juice');
  await item.getByLabel('Quantity', { exact: true }).fill('40');
  await page
    .getByLabel('100% reference ingredient (optional)')
    .selectOption({ label: 'Butter (200 g)' });
  await page
    .getByRole('button', { name: 'Add cooking stage', exact: true })
    .click();
  stage = page.locator('[data-group]').last();
  await stage.getByLabel('Stage name').fill('Finish');
  item = stage.locator('[data-ingredient]').first();
  await item.getByLabel('Ingredient', { exact: true }).fill('Salt');
  await item.getByLabel('Quantity', { exact: true }).fill('as needed');
  await item.getByLabel('Unit', { exact: true }).selectOption('');
  await stage.getByLabel('Step 1', { exact: true }).fill('Season and serve.');
  await stage.getByRole('button', { name: 'Add step', exact: true }).click();
  await stage.getByLabel('Step 2', { exact: true }).fill('Keep warm.');
  await stage
    .getByRole('button', { name: 'Move step 2 up', exact: true })
    .click();
  await page.screenshot({
    path: testInfo.outputPath('editor.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('editor-mobile.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole('button', { name: 'Save recipe', exact: true }).click();
  await expect(page).toHaveURL(/\/recipes\/\d+$/);
  await expect(
    page.getByRole('heading', { name: 'Brown butter sauce' }),
  ).toBeVisible();
  await expect(page.getByText('20%', { exact: true })).toBeVisible();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await expect(page.locator('[data-ingredient-note]')).toHaveText(
    'Unsalted, cubed',
  );
  await expect(page.locator('[data-stage-heading]')).toHaveText([
    'Brown the butter',
    'Finish',
  ]);
  await expect(page.locator('table strong')).toHaveText([
    '150 °C',
    '5–6 minutes',
  ]);
  await expect(page.locator('[data-categories]')).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('card.png'),
    fullPage: true,
  });
  await expect(page.locator('tbody').last().locator('li').first()).toHaveText(
    'Keep warm.',
  );
  await page.getByLabel('Batch size', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.locator('[data-yield]')).toContainText('Yields 500 g');
  await expect(page.locator('[data-yield]')).toContainText(
    'Original yield: 250 g',
  );
  await expect(
    page.getByRole('cell', { name: '400 g', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'as needed', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /^(Half|Original|Double)$/ }),
  ).toHaveCount(0);
  await page.getByLabel('Butter amount', { exact: true }).fill('0.6');
  await page.getByLabel('Ingredient weight unit').selectOption('kg');
  await page
    .getByRole('button', { name: 'Scale by ingredient', exact: true })
    .click();
  await expect(page.getByLabel('Batch size', { exact: true })).toHaveValue('3');
  await expect(page.getByLabel('Butter amount', { exact: true })).toHaveValue(
    '0.6',
  );
  await expect(page.getByLabel('Ingredient weight unit')).toHaveValue('kg');
  await expect(
    page.getByRole('cell', { name: '600 g', exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-yield]')).toContainText('Yields 750 g');
  await page.screenshot({
    path: testInfo.outputPath('scaled-by-ingredient.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Edit recipe', exact: true }).click();
  await expect(
    page.getByLabel('100% reference ingredient (optional)'),
  ).not.toHaveValue('');
  await page.getByLabel('Recipe title').fill('Warm brown butter sauce');
  await expect(page.getByLabel('Ingredient notes').first()).toHaveValue(
    'Unsalted, cubed',
  );
  await expect(
    page.getByRole('checkbox', { name: 'Sides', exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Pantry staples', exact: true }),
  ).toBeChecked();
  await page.getByRole('checkbox', { name: 'Sides', exact: true }).uncheck();
  await page
    .getByRole('button', { name: 'Move stage 2 up', exact: true })
    .click();
  await page.getByRole('button', { name: 'Save recipe', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Warm brown butter sauce' }),
  ).toBeVisible();
  await expect(page.locator('tbody').first()).toHaveAttribute(
    'aria-label',
    'Finish',
  );
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('button', { name: 'Print / PDF' })).toBeHidden();
  await expect(page.locator('table')).toBeVisible();
  const printColumns = await page
    .locator('article table')
    .evaluate((table) => ({
      heading: table
        .querySelector('thead th:last-child')
        .getBoundingClientRect().left,
      cell: table.querySelector('[data-procedure]').getBoundingClientRect()
        .left,
      step: table.tBodies[0].querySelector('li').getBoundingClientRect().left,
    }));
  expect(Math.abs(printColumns.cell - printColumns.heading)).toBeLessThan(1);
  expect(printColumns.step).toBeGreaterThan(printColumns.heading);
  await page.screenshot({
    path: testInfo.outputPath('print.png'),
    fullPage: true,
  });
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('mobile.png'),
    fullPage: true,
  });
  await page.getByText('Delete recipe', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Confirm deletion', exact: true })
    .click();
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('link', { name: 'Warm brown butter sauce', exact: true }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('multipart recipe cards retain their layout without a scaling column on screen and in print', async ({
  page,
}, testInfo) => {
  const source = seedRecipes.find((recipe) => recipe.title === 'Arancini');
  const response = await page.request.post('/api/recipes', { data: source });
  expect(response.status()).toBe(201);
  const { id } = await response.json();
  await page.goto(`/recipes/${id}`);
  await expect(page.getByRole('columnheader')).toHaveText([
    'Ingredient',
    'Quantity',
    'Procedure',
  ]);
  await expect(page.locator('[data-stage-heading]')).toHaveText(
    source.groups.map((group) => group.title),
  );
  await page.getByLabel('Batch size', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.locator('[data-yield]')).toContainText(
    'Yields 64 arancini',
  );
  await expect(
    page.getByRole('cell', { name: '4 L', exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('[data-ingredient-note]').filter({ hasText: /^Or more$/ }),
  ).toHaveCount(1);
  await page.screenshot({
    path: testInfo.outputPath('arancini.png'),
    fullPage: true,
  });
  await page.emulateMedia({ media: 'print' });
  const columns = await page.locator('article table').evaluate((table) => ({
    heading: table.querySelector('thead th:last-child').getBoundingClientRect()
      .left,
    cell: table.querySelector('[data-procedure]').getBoundingClientRect().left,
    alignment: getComputedStyle(table.querySelector('[data-procedure]'))
      .textAlign,
  }));
  expect(Math.abs(columns.cell - columns.heading)).toBeLessThan(1);
  expect(columns.alignment).toBe('left');
  await page.screenshot({
    path: testInfo.outputPath('arancini-print.png'),
    fullPage: true,
  });
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('arancini-mobile.png'),
    fullPage: true,
  });
});

test('invalid scaling retains the draft and can be corrected', async ({
  page,
}) => {
  await page.goto('/recipes/new');
  await page.getByLabel('Recipe title').fill('Test draft');
  await page.getByLabel('Ingredient', { exact: true }).fill('Gelatin');
  await page.getByLabel('Quantity', { exact: true }).fill('1');
  await page.getByLabel('Step 1', { exact: true }).fill('Hydrate.');
  await page.getByText('Options', { exact: true }).click();
  await page.getByLabel('Special scaling (%)').fill('1.6');
  await page.getByRole('button', { name: 'Save recipe', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'explanation of its basis',
  );
  await expect(page.getByLabel('Recipe title')).toHaveValue('Test draft');
  await page.getByLabel('Percentage basis').fill('total liquid weight');
  await page.getByRole('button', { name: 'Save recipe', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test draft' })).toBeVisible();
  await expect(
    page.getByText('Gelatin: 1.6% of total liquid weight.'),
  ).toBeVisible();
});

test('consolidated ingredients combine repeated items and retain scaling across views', async ({
  page,
}, testInfo) => {
  const source = structuredClone(
    seedRecipes.find((recipe) => recipe.title === 'Arancini'),
  );
  source.referenceId = 'rice-grains';
  const response = await page.request.post('/api/recipes', { data: source });
  expect(response.status()).toBe(201);
  const { id } = await response.json();
  await page.goto(`/recipes/${id}`);
  await page.getByRole('link', { name: 'Ingredients', exact: true }).click();
  const ingredients = page.getByRole('list', {
    name: 'Consolidated ingredients',
  });
  const cheese = ingredients
    .getByRole('listitem')
    .filter({ hasText: 'Caciocavallo' });
  const butter = ingredients
    .getByRole('listitem')
    .filter({ hasText: 'Butter' });
  await expect(cheese).toHaveCount(1);
  await expect(cheese).toHaveText('200 g Caciocavallo');
  await expect(ingredients.getByRole('listitem').first()).toHaveText(
    '1 kg Rice',
  );
  await expect(
    ingredients.getByRole('listitem').filter({ hasText: 'Olive oil' }),
  ).toHaveText('2 tbsp Olive oil');
  await expect(butter).toHaveCount(1);
  await expect(butter).toHaveText('185 g + 1 1/2 tsp Butter');
  await expect(
    ingredients.getByRole('listitem').filter({ hasText: 'Saffron' }),
  ).toHaveText('Saffron (as needed)');
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.locator('article small, article h2')).toHaveCount(0);
  await page.getByLabel('Batch size', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(ingredients).toBeVisible();
  await expect(cheese).toHaveText('400 g Caciocavallo');
  await expect(butter).toHaveText('370 g + 1 tbsp Butter');
  await expect(page.locator('[data-yield]')).toContainText('64 arancini');
  await page.getByLabel('Rice amount', { exact: true }).fill('3');
  await page.getByLabel('Ingredient weight unit').selectOption('kg');
  await page
    .getByRole('button', { name: 'Scale by ingredient', exact: true })
    .click();
  await expect(ingredients).toBeVisible();
  await expect(cheese).toHaveText('600 g Caciocavallo');
  await page.getByRole('link', { name: 'Procedure', exact: true }).click();
  await expect(page.getByLabel('Batch size', { exact: true })).toHaveValue('3');
  await expect(page.getByLabel('Rice amount', { exact: true })).toHaveValue(
    '3',
  );
  await expect(page.getByLabel('Ingredient weight unit')).toHaveValue('kg');
  await expect(
    page.getByRole('region', { name: 'Recipe procedure' }),
  ).toBeVisible();
  await expect(
    page.locator('[data-ingredient-note]').filter({ hasText: 'Grated;' }),
  ).toContainText('Grated; aged provolone');
  await expect(
    page.getByRole('heading', { name: 'Notes', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Ingredients', exact: true }).click();
  await expect(cheese).toHaveText('600 g Caciocavallo');
  await page.screenshot({
    path: testInfo.outputPath('ingredients.png'),
    fullPage: true,
  });
  await page.emulateMedia({ media: 'print' });
  await expect(
    page.getByRole('navigation', { name: 'Recipe views' }),
  ).toBeHidden();
  await expect(ingredients).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await ingredients.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('ingredients-mobile.png'),
    fullPage: true,
  });
  const saved = await (await page.request.get(`/api/recipes/${id}`)).json();
  expect(saved.groups).toEqual(source.groups);
});
