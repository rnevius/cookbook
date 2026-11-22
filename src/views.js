import {
  consolidateIngredients,
  cookingUnits,
  formatNumber,
  numericQuantity,
  recipeCategories,
  scaledAmount,
  scaledYield,
  scalingPercent,
} from './recipe.js';

export function escape(value = '') {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ],
  );
}

export function layout(title, content, script = '') {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} · Artisanist</title><link rel="stylesheet" href="/style.css">
${script ? `<script type="module" src="/${script}.js"></script>` : ''}</head>
<body><main>${content}</main></body></html>`;
}

export function library(recipes) {
  return layout(
    'Recipes',
    `<nav><h1>Recipes</h1><a href="/recipes/new">New recipe</a></nav>
${recipes.length ? `<ul>${recipes.map((recipe) => `<li><a href="/recipes/${recipe.id}">${escape(recipe.title)}</a></li>`).join('')}</ul>` : '<p>No recipes yet.</p>'}`,
  );
}

// Emphasize explicit temperatures and durations after escaping authored text.
function procedure(value) {
  return escape(value).replace(
    /(?<![\w.])(-?\d+(?:\.\d+)?(?:\s*(?:[–—-]|to)\s*-?\d+(?:\.\d+)?)?\s*(?:[°º]\s*[CF]\b|(?:seconds?|secs?|s|minutes?|mins?|hours?|hrs?|h)\b))/gi,
    '<strong>$1</strong>',
  );
}

function ingredientsList(recipe, scale, components) {
  const ingredients = consolidateIngredients(recipe);
  return ingredients.length
    ? `<ul aria-label="Consolidated ingredients" data-ingredients>${ingredients
        .map((item) => {
          const component = components.find(
            (recipe) => recipe.id === item.componentId,
          );
          const amounts = item.amounts
            .map((amount) => scaledAmount(amount.quantity, amount.unit, scale))
            .filter(Boolean);
          const name = component
            ? `<a href="/recipes/${component.id}">${escape(item.name)}</a>`
            : escape(item.name);
          const amount = escape(amounts.join(' + '));
          const qualitative = item.amounts.every(
            (amount) => numericQuantity(amount.quantity) === null,
          );
          return `<li>${qualitative ? `${name}${amount ? ` (${amount})` : ''}` : `${amount} ${name}`}</li>`;
        })
        .join('')}</ul>`
    : '<p>No ingredients listed.</p>';
}

export function card(
  recipe,
  scale,
  components,
  ingredientTarget,
  view = 'procedure',
) {
  const ingredientsView = view === 'ingredients';
  const viewInput = ingredientsView
    ? '<input type="hidden" name="view" value="ingredients">'
    : '';
  const viewLink = (target) => {
    const query = new URLSearchParams();
    if (target === 'ingredients') query.set('view', target);
    if (ingredientTarget) {
      query.set('ingredientAmount', ingredientTarget.quantity);
      query.set('ingredientUnit', ingredientTarget.unit);
    } else if (scale !== 1) query.set('scale', scale);
    return `/recipes/${recipe.id}${query.size ? `?${query}` : ''}`;
  };
  const yieldValue = scaledYield(recipe.yield, scale);
  const yieldLabel = yieldValue
    ? `Yields ${escape(yieldValue)}`
    : scale === 1
      ? 'Yield not specified'
      : `${formatNumber(scale)}× batch`;
  const yieldNote =
    scale !== 1
      ? `<small>${yieldValue ? `${formatNumber(scale)}× batch · Original yield: ` : 'Yield per original batch: '}${escape(recipe.yield || 'not specified')}</small>`
      : '';
  const reference = recipe.groups
    .flatMap((group) => group.ingredients)
    .find((item) => item.id === recipe.referenceId);
  const showScaling = Boolean(
    reference ||
    recipe.groups.some((group) =>
      group.ingredients.some((item) => item.specialPercent),
    ),
  );
  const columns = showScaling ? 4 : 3;
  const targetQuantity = reference
    ? (ingredientTarget?.quantity ??
      String(
        Number((numericQuantity(reference.quantity) * scale).toPrecision(10)),
      ))
    : '';
  const targetUnit =
    ingredientTarget?.unit ?? reference?.unit.trim().toLowerCase();
  const ingredientScaling = reference
    ? `<form method="get" aria-label="Scale by primary ingredient">${viewInput}<label for="ingredient-amount">${escape(reference.name)} amount</label><div><input id="ingredient-amount" name="ingredientAmount" type="number" min="0.000001" step="any" value="${escape(targetQuantity)}" required><select name="ingredientUnit" aria-label="Ingredient weight unit">${cookingUnits[0].units.map((unit) => `<option value="${unit}"${unit === targetUnit ? ' selected' : ''}>${unit}</option>`).join('')}</select><button type="submit">Scale by ingredient</button></div></form>`
    : '';
  let stepNumber = 1;
  const groups = recipe.groups
    .map((group) => {
      const steps = `<ol start="${stepNumber}">${group.steps.map((step) => `<li>${procedure(step)}</li>`).join('')}</ol>`;
      const heading = group.title
        ? `<tr data-stage-heading><th scope="rowgroup" colspan="${columns}">${escape(group.title)}</th></tr>`
        : '';
      stepNumber += group.steps.length;
      if (!group.ingredients.length)
        return `<tbody aria-label="${escape(group.title || 'Preparation')}">${heading}<tr><td colspan="${columns - 1}">—</td><td data-procedure>${steps}</td></tr></tbody>`;
      return `<tbody aria-label="${escape(group.title || 'Preparation')}">${heading}${group.ingredients
        .map((item, row) => {
          const component = components.find(
            (recipe) => recipe.id === item.componentId,
          );
          return `<tr><th scope="row">${escape(item.name)}${item.notes ? `<small data-ingredient-note>${escape(item.notes)}</small>` : ''}${component ? `<small><a href="/recipes/${component.id}">Component: ${escape(component.title)}</a></small>` : ''}</th>
<td>${escape(scaledAmount(item.quantity, item.unit, scale))}</td>
${showScaling ? `<td>${scalingPercent(item, reference)}${item.specialPercent ? `<small>(${escape(item.specialPercent)}%*)</small>` : ''}</td>` : ''}
${row === 0 ? `<td data-procedure rowspan="${group.ingredients.length}">${steps}</td>` : ''}</tr>`;
        })
        .join('')}</tbody>`;
    })
    .join('');
  const specialNotes = recipe.groups
    .flatMap((group) => group.ingredients)
    .filter((item) => item.specialPercent)
    .map(
      (item) =>
        `<li>${escape(item.name)}: ${escape(item.specialPercent)}% of ${escape(item.specialBasis)}.</li>`,
    );
  return layout(
    recipe.title,
    `<nav aria-label="Recipe actions"><a href="/">All recipes</a><span><a href="/recipes/${recipe.id}/edit">Edit recipe</a> <button type="button" id="print">Print / PDF</button></span></nav>
<section id="scale" aria-label="Recipe scaling"><form method="get" aria-label="Adjust batch size">${viewInput}<label for="factor">Batch size</label><div><input id="factor" name="scale" type="number" min="0.001" max="1000" step="any" value="${scale}"${ingredientsView ? '' : ' aria-describedby="batch-help"'} required><span>×</span><button type="submit">Apply</button></div></form>${ingredientScaling}${ingredientsView ? '' : `<small id="batch-help">1× is the original recipe${recipe.yield ? ` (${escape(recipe.yield)})` : ''}. Cooking times stay as written.</small>`}</section>
<nav aria-label="Recipe views"><a href="${escape(viewLink('procedure'))}"${!ingredientsView ? ' aria-current="page"' : ''}>Procedure</a><a href="${escape(viewLink('ingredients'))}"${ingredientsView ? ' aria-current="page"' : ''}>Ingredients</a></nav>
<article><header><h1>${escape(recipe.title)}</h1><p data-yield>${yieldLabel}${ingredientsView ? '' : yieldNote}</p>${!ingredientsView && recipe.attribution ? `<small>${escape(recipe.attribution)}</small>` : ''}</header>
${
  ingredientsView
    ? ingredientsList(recipe, scale, components)
    : `<div role="region" aria-label="Recipe procedure" tabindex="0"><table data-scaling="${showScaling}"><colgroup><col data-column="ingredient"><col data-column="quantity">${showScaling ? '<col data-column="scaling">' : ''}<col data-column="procedure"></colgroup><thead><tr><th scope="col">Ingredient</th><th scope="col">Quantity</th>${showScaling ? '<th scope="col">Scaling</th>' : ''}<th scope="col">Procedure</th></tr></thead>${groups}</table></div>
${reference ? `<p><small>100% = ${escape(reference.name)}.</small></p>` : ''}
${specialNotes.length ? `<aside><h2>Special scaling</h2><ul>${specialNotes.join('')}</ul><small>* These ratios use the stated basis rather than the 100% reference ingredient.</small></aside>` : ''}`
}
${!ingredientsView && recipe.notes ? `<section><h2>Notes</h2><p data-multiline>${escape(recipe.notes)}</p></section>` : ''}
</article>
<details id="delete-panel"><summary>Delete recipe</summary><p>This permanently deletes this recipe from your notebook.</p><button type="button" id="delete" data-id="${recipe.id}">Confirm deletion</button><p id="delete-error" role="alert"></p></details>`,
    'card',
  );
}

export function editor(recipe, components) {
  const data = JSON.stringify({ recipe, components }).replace(/</g, '\\u003c');
  return layout(
    recipe ? `Edit ${recipe.title}` : 'New recipe',
    `<nav><a id="cancel" href="${recipe ? `/recipes/${recipe.id}` : '/'}">Cancel</a><span>Recipe editor</span></nav>
<h1>${recipe ? 'Edit recipe' : 'New recipe'}</h1>
<noscript><p>The recipe editor needs JavaScript enabled.</p></noscript>
<form id="editor" hidden>
<header>
<label for="title">Recipe title</label><input id="title" name="title" maxlength="200" required autocomplete="off">
<label for="yield">Finished yield</label><input id="yield" name="yield" maxlength="200" placeholder="e.g. 750 g / 4 portions">
</header>
<h2>Cooking stages</h2><div id="groups"></div><button type="button" id="add-group">Add cooking stage</button>
<label for="reference">100% reference ingredient (optional)</label><select id="reference" name="referenceId"><option value="">No reference ingredient</option></select><small>Choose a positive weight in g, kg, mg, oz, or lb. Decimals and fractions scale; text such as “as needed” stays as written. Put qualifiers such as “or more” in ingredient notes. Keep batch amounts in the ingredient list; quantities in procedure text stay as written.</small>
<details id="metadata"><summary>Attribution and notes</summary>
<label for="attribution">Attribution</label><input id="attribution" name="attribution" maxlength="200" placeholder="Inspired by…">
<label for="notes">Recipe notes</label><textarea id="notes" name="notes" rows="3" maxlength="10000"></textarea></details>
<fieldset id="categories"><legend>Categories</legend><div>${recipeCategories.map((category) => `<label><input type="checkbox" name="categories" value="${escape(category)}"${recipe?.categories?.includes(category) ? ' checked' : ''}>${escape(category)}</label>`).join('')}</div></fieldset>
<p id="save-error" role="alert" tabindex="-1"></p><button type="submit" id="save">Save recipe</button>
</form><script type="application/json" id="editor-data">${data}</script>`,
    'editor',
  );
}

export function errorPage(status, message) {
  return layout(
    `${status}`,
    `<h1>${status === 404 ? 'Recipe not found' : 'Unable to complete this request'}</h1><p>${escape(message)}</p><a href="/">Back to recipes</a>`,
  );
}
