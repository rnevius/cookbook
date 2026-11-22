import {
  cookingUnits,
  maxPhotoBytes,
  maxRecipePhotos,
  recipePhotoTypes,
} from '/recipe.js';

const { recipe, components } = JSON.parse(
  document.querySelector('#editor-data').textContent,
);
const form = document.querySelector('#editor');
const container = document.querySelector('#groups');
const reference = document.querySelector('#reference');
const error = document.querySelector('#save-error');
const photoList = document.querySelector('#photo-list');
const photoFiles = document.querySelector('#photo-files');
const photoError = document.querySelector('#photo-error');
const photos = [];
let dirty = false;

const escape = (value = '') =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ],
  );
const ingredient = () => ({
  id: crypto.randomUUID(),
  name: '',
  notes: '',
  quantity: '',
  unit: 'g',
  specialPercent: '',
  specialBasis: '',
  componentId: null,
});
const group = () => ({
  id: crypto.randomUUID(),
  title: '',
  ingredients: [ingredient()],
  steps: [''],
});
let groups = recipe?.groups || [group()];
let referenceId = recipe?.referenceId || null;

for (const key of ['title', 'yield', 'attribution', 'notes'])
  form.elements[key].value = recipe?.[key] || '';
if (recipe?.attribution || recipe?.notes)
  document.querySelector('#metadata').open = true;

function addPhoto({ id, alt = '', file }) {
  const row = document.createElement('li');
  row.innerHTML = `<img alt=""><label>Photo description (optional)<input maxlength="200"></label><button type="button">Remove photo</button>`;
  const preview = row.querySelector('img');
  const description = row.querySelector('input');
  const remove = row.querySelector('button');
  preview.src = file
    ? URL.createObjectURL(file)
    : `/recipes/${recipe.id}/photos/${id}`;
  description.value = alt;
  const photo = { id, file, preview, description };
  photos.push(photo);
  photoList.append(row);
  photoList.hidden = false;
  remove.addEventListener('click', () => {
    photos.splice(photos.indexOf(photo), 1);
    const nextRow = row.nextElementSibling || row.previousElementSibling;
    if (file) URL.revokeObjectURL(preview.src);
    row.remove();
    photoList.hidden = photos.length === 0;
    photoError.textContent = '';
    dirty = true;
    (nextRow?.querySelector('button') || photoFiles).focus();
  });
}

for (const photo of recipe?.photos || []) addPhoto(photo);

photoFiles.addEventListener('change', () => {
  const files = [...photoFiles.files];
  photoFiles.value = '';
  photoError.textContent = '';
  if (photos.length + files.length > maxRecipePhotos) {
    photoError.textContent = `A recipe can have up to ${maxRecipePhotos} photos.`;
    return;
  }
  for (const file of files) {
    if (
      !file.size ||
      file.size > maxPhotoBytes ||
      (file.type && !recipePhotoTypes.includes(file.type))
    ) {
      photoError.textContent =
        document.querySelector('#photo-help').textContent;
      continue;
    }
    addPhoto({ file });
    dirty = true;
  }
});

async function photoData(file, preview) {
  try {
    await preview.decode();
  } catch {
    throw new Error(
      `Unable to open “${file.name}” as a photo. Choose a different file.`,
    );
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result.split(',')[1]));
    reader.addEventListener('error', () =>
      reject(new Error('Unable to read a photo. Select the file again.')),
    );
    reader.readAsDataURL(file);
  });
}

function readGroups() {
  return [...container.querySelectorAll('[data-group]')].map((element) => ({
    id: element.dataset.group,
    title: element.querySelector('[data-field="group-title"]').value,
    ingredients: [...element.querySelectorAll('[data-ingredient]')].map(
      (row) => {
        const item = { id: row.dataset.ingredient };
        for (const key of [
          'name',
          'notes',
          'quantity',
          'unit',
          'specialPercent',
          'specialBasis',
          'componentId',
        ]) {
          const value = row.querySelector(`[data-field="${key}"]`).value;
          item[key] =
            key === 'componentId' ? (value ? Number(value) : null) : value;
        }
        return item;
      },
    ),
    steps: [...element.querySelectorAll('[data-step] textarea')].map(
      (input) => input.value,
    ),
  }));
}

function updateReference() {
  const items = readGroups().flatMap((group) => group.ingredients);
  if (!items.some((item) => item.id === referenceId)) referenceId = null;
  reference.innerHTML =
    '<option value="">No reference ingredient</option>' +
    items
      .map(
        (item) =>
          `<option value="${escape(item.id)}"${item.id === referenceId ? ' selected' : ''}>${escape(item.name || 'Unnamed ingredient')} (${escape(item.quantity)} ${escape(item.unit)})</option>`,
      )
      .join('');
}

function button(action, text, label, disabled = false) {
  return `<button type="button" data-action="${action}" aria-label="${escape(label)}"${disabled ? ' disabled' : ''}>${text}</button>`;
}

function unitSelect(current) {
  const known = cookingUnits.some((group) => group.units.includes(current));
  return `<select aria-label="Unit" data-field="unit"><option value=""${current === '' ? ' selected' : ''}>No unit</option>${cookingUnits.map((group) => `<optgroup label="${group.label}">${group.units.map((unit) => `<option value="${unit}"${unit === current ? ' selected' : ''}>${unit}</option>`).join('')}</optgroup>`).join('')}${current && !known ? `<option value="${escape(current)}" selected>${escape(current)} (saved)</option>` : ''}</select>`;
}

function render() {
  container.innerHTML = groups
    .map(
      (
        stage,
        index,
      ) => `<fieldset data-group="${escape(stage.id)}"><legend>Stage ${index + 1}</legend>
<nav aria-label="Stage ${index + 1} controls"><span>${button('group-up', '↑', `Move stage ${index + 1} up`, index === 0)}${button('group-down', '↓', `Move stage ${index + 1} down`, index === groups.length - 1)}</span>${button('group-remove', 'Remove stage', `Remove stage ${index + 1}`, groups.length === 1)}</nav>
<label>Stage name<input data-field="group-title" maxlength="200" value="${escape(stage.title)}" placeholder="e.g. Prepare the cure"></label>
<h3>Ingredients</h3><div data-ingredients>${stage.ingredients
        .map(
          (
            item,
            position,
          ) => `<section data-ingredient="${escape(item.id)}" aria-label="Ingredient ${position + 1}">
<div data-ingredient-fields><label>Ingredient<input data-field="name" maxlength="200" value="${escape(item.name)}" required></label><label>Quantity<input data-field="quantity" maxlength="80" value="${escape(item.quantity)}" placeholder="100"></label><label>Unit${unitSelect(item.unit)}</label></div>
<details${item.notes || item.specialPercent || item.specialBasis || item.componentId ? ' open' : ''}><summary>Options</summary>
<label>Ingredient notes<input data-field="notes" maxlength="200" value="${escape(item.notes || '')}" placeholder="e.g. finely chopped; optional; or more"></label>
<label>Special scaling (%)<input data-field="specialPercent" inputmode="decimal" maxlength="40" value="${escape(item.specialPercent)}" placeholder="e.g. 1.6"></label>
<label>Percentage basis<input data-field="specialBasis" maxlength="200" value="${escape(item.specialBasis)}" placeholder="e.g. total weight of all other ingredients"></label>
<label>Component recipe<select data-field="componentId"><option value="">No component recipe</option>${components.map((component) => `<option value="${component.id}"${component.id === item.componentId ? ' selected' : ''}>${escape(component.title)}</option>`).join('')}</select></label></details>
<nav aria-label="Ingredient ${position + 1} controls">${button('ingredient-up', '↑', `Move ingredient ${position + 1} up`, position === 0)}${button('ingredient-down', '↓', `Move ingredient ${position + 1} down`, position === stage.ingredients.length - 1)}${button('ingredient-remove', 'Remove', `Remove ingredient ${position + 1}`)}</nav></section>`,
        )
        .join('')}</div>
${button('ingredient-add', 'Add ingredient', 'Add ingredient')}
<h3>Procedure</h3><div data-steps>${stage.steps.map((step, position) => `<div data-step="${position}"><label>Step ${position + 1}<textarea data-field="step" rows="2" maxlength="10000" required placeholder="Describe the procedure.">${escape(step)}</textarea></label><nav aria-label="Step ${position + 1} controls">${button('step-up', '↑', `Move step ${position + 1} up`, position === 0)}${button('step-down', '↓', `Move step ${position + 1} down`, position === stage.steps.length - 1)}${button('step-remove', 'Remove', `Remove step ${position + 1}`, stage.steps.length === 1)}</nav></div>`).join('')}</div>
${button('step-add', 'Add step', 'Add step')}</fieldset>`,
    )
    .join('');
  updateReference();
}

const swap = (items, index, offset) => {
  [items[index], items[index + offset]] = [items[index + offset], items[index]];
};

container.addEventListener('click', (event) => {
  const target = event.target.closest('button[data-action]');
  if (!target) return;
  groups = readGroups();
  const element = target.closest('[data-group]');
  const index = groups.findIndex((group) => group.id === element.dataset.group);
  const stage = groups[index];
  const action = target.dataset.action;
  let focus = null;
  if (action === 'group-up') swap(groups, index, -1);
  if (action === 'group-down') swap(groups, index, 1);
  if (action === 'group-remove') {
    if (
      (stage.title ||
        stage.ingredients.some((item) => item.name) ||
        stage.steps.some(Boolean)) &&
      !window.confirm('Remove this stage and its ingredients and steps?')
    )
      return;
    groups.splice(index, 1);
  }
  if (action === 'ingredient-add') {
    const item = ingredient();
    stage.ingredients.push(item);
    focus = `[data-ingredient="${item.id}"] input`;
  }
  if (action.startsWith('ingredient-') && action !== 'ingredient-add') {
    const position = stage.ingredients.findIndex(
      (item) =>
        item.id === target.closest('[data-ingredient]').dataset.ingredient,
    );
    if (action === 'ingredient-remove') stage.ingredients.splice(position, 1);
    if (action === 'ingredient-up') swap(stage.ingredients, position, -1);
    if (action === 'ingredient-down') swap(stage.ingredients, position, 1);
  }
  if (action === 'step-add') {
    stage.steps.push('');
    focus = `[data-group="${stage.id}"] [data-step="${stage.steps.length - 1}"] textarea`;
  }
  if (action.startsWith('step-') && action !== 'step-add') {
    const position = Number(target.closest('[data-step]').dataset.step);
    if (action === 'step-remove') stage.steps.splice(position, 1);
    if (action === 'step-up') swap(stage.steps, position, -1);
    if (action === 'step-down') swap(stage.steps, position, 1);
  }
  dirty = true;
  render();
  if (focus) container.querySelector(focus)?.focus();
  else {
    const stageElement =
      [...container.querySelectorAll('[data-group]')].find(
        (item) => item.dataset.group === stage.id,
      ) || container.querySelector('[data-group]');
    stageElement.querySelector('[data-field="group-title"]').focus();
  }
});

document.querySelector('#add-group').addEventListener('click', () => {
  groups = readGroups();
  groups.push(group());
  dirty = true;
  render();
  container.lastElementChild.querySelector('input').focus();
});
form.addEventListener('input', (event) => {
  if (event.target !== photoFiles) dirty = true;
  if (['name', 'quantity', 'unit'].includes(event.target.dataset.field))
    updateReference();
});
form.addEventListener('change', (event) => {
  if (event.target !== photoFiles) dirty = true;
});
reference.addEventListener('change', () => {
  referenceId = reference.value || null;
  updateReference();
});
window.addEventListener('beforeunload', (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const document = {
    groups: readGroups(),
    referenceId,
    categories: [...form.querySelectorAll('[name="categories"]:checked')].map(
      (input) => input.value,
    ),
  };
  for (const key of ['title', 'yield', 'attribution', 'notes'])
    document[key] = form.elements[key].value;
  error.textContent = '';
  const controls = [
    ...form.querySelectorAll('input, select, textarea, button'),
  ];
  const previous = controls.map((control) => control.disabled);
  controls.forEach((control) => {
    control.disabled = true;
  });
  const save = form.querySelector('#save');
  save.textContent = 'Saving…';
  try {
    document.photos = await Promise.all(
      photos.map(async ({ id, file, preview, description }) => {
        const alt = description.value.trim();
        return file
          ? { alt, data: await photoData(file, preview) }
          : { id, alt };
      }),
    );
    const response = await fetch(
      recipe ? `/api/recipes/${recipe.id}` : '/api/recipes',
      {
        method: recipe ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(document),
      },
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    dirty = false;
    window.location.assign(`/recipes/${result.id}`);
  } catch (reason) {
    error.textContent =
      reason.message ||
      'Unable to save. Your changes are still here; please try again.';
    controls.forEach((control, index) => {
      control.disabled = previous[index];
    });
    save.textContent = 'Save recipe';
    error.focus();
  }
});

render();
form.hidden = false;
