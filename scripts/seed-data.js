const ingredient = (id, name, quantity, unit = '', notes = '') => ({
  id,
  name,
  quantity,
  unit,
  notes,
  specialPercent: '',
  specialBasis: '',
  componentId: null,
});

export const seedRecipes = [
  {
    title: 'Bagels (yeasted)',
    yield: '',
    categories: ['Bread'],
    attribution: '',
    referenceId: 'flour',
    notes:
      'Uses fresh yeast. Portion the dough at 111 g per bagel; the finished yield was not recorded. The original boiling-bath amount was 45 g malt syrup, equivalent to 1.5 L water at 30 g/L. Adjust the bath to the pot while keeping that concentration.',
    groups: [
      {
        id: 'dough',
        title: 'Dough',
        ingredients: [
          ingredient('flour', 'Bread flour', '454', 'g'),
          ingredient('salt', 'Salt', '8.5', 'g'),
          ingredient('yeast', 'Fresh yeast', '3', 'g'),
          ingredient('water', 'Water', '263', 'ml', '25 °C'),
          ingredient('malt-powder', 'Diastatic malt powder', '3', 'g'),
        ],
        steps: [
          'Mix the dough ingredients together and knead for 10 minutes.',
          'Let rise for 1 hour.',
        ],
      },
      {
        id: 'shape',
        title: 'Shape and refrigerate',
        ingredients: [
          ingredient(
            'semolina',
            'Semolina flour',
            'as needed',
            '',
            'For the trays',
          ),
        ],
        steps: [
          'Divide the dough into 111 g pieces and shape into bagels.',
          'Sprinkle trays liberally with semolina flour. Place the bagels on the trays and immediately refrigerate overnight.',
        ],
      },
      {
        id: 'boil',
        title: 'Boil',
        ingredients: [
          ingredient(
            'bath-water',
            'Water',
            'as needed',
            '',
            'For the boiling bath',
          ),
          ingredient(
            'malt-syrup',
            'Malt syrup',
            'as needed',
            '',
            '30 g per liter of bath water',
          ),
        ],
        steps: [
          'Prepare a boiling bath with 30 g malt syrup per liter of water.',
          'Boil the bagels for about 60–90 seconds each, at least until they float.',
          'Let dry for a few minutes on a wire rack.',
        ],
      },
      {
        id: 'bake',
        title: 'Bake',
        ingredients: [],
        steps: ['Bake on parchment at 225 °C for 15–18 minutes.'],
      },
    ],
  },
  {
    title: 'Vanilla syrup',
    yield: '',
    categories: ['Pantry staples'],
    attribution: '',
    referenceId: null,
    notes:
      'Originally titled “Vanilla Extract”; renamed to describe the supplied water-and-sugar preparation. The finished yield was not recorded. Storage instruction from the original notes: keep refrigerated for up to 1 month.',
    groups: [
      {
        id: 'prepare-vanilla',
        title: 'Prepare the vanilla',
        ingredients: [ingredient('vanilla', 'Vanilla bean', '1')],
        steps: [
          'Slit the vanilla bean lengthwise with a small, sharp knife. Scrape out the seeds with the tip of the knife; reserve both seeds and pod.',
        ],
      },
      {
        id: 'reduce',
        title: 'Boil and reduce',
        ingredients: [
          ingredient(
            'water',
            'Water',
            '125',
            'ml',
            'Original alternative measure: 1/2 cup',
          ),
          ingredient('sugar', 'Superfine sugar', '30', 'g'),
        ],
        steps: [
          'Place the vanilla seeds and pod in a medium saucepan with the water and sugar. Bring to a boil.',
          'Boil rapidly for about 15 minutes, until reduced to one-third of the original volume.',
        ],
      },
      {
        id: 'store',
        title: 'Cool and store',
        ingredients: [],
        steps: [
          'Pour into a jar and leave to cool, then seal with a tight-fitting lid. Keep refrigerated.',
        ],
      },
    ],
  },
  {
    title: 'Arancini',
    yield: '32 arancini',
    categories: ['Mains'],
    attribution: '',
    referenceId: null,
    notes:
      'The rice needs at least 4 hours to cool. Let both the ragù and béchamel cool before combining. Aim for equal proportions of diced celery, carrot, and onion. The original 200 g cheese is divided between grated cheese in the filling and cubes for assembly.',
    groups: [
      {
        id: 'rice',
        title: 'Rice',
        ingredients: [
          ingredient('rice-grains', 'Rice', '1', 'kg', 'Carnaroli or Arborio'),
          ingredient('rice-water', 'Water', '2', 'L'),
          ingredient('stock', 'Vegetable stock cubes', '2'),
          ingredient('saffron', 'Saffron', 'as needed', '', 'Optional'),
          ingredient(
            'rice-butter',
            'Butter',
            '185',
            'g',
            'Cut into large cubes',
          ),
        ],
        steps: [
          'Cook the rice in the water with the stock cubes and optional saffron. The original recipe uses half-strength vegetable stock. Do not use a rice cooker.',
          'When the rice is cooked, cream in the butter. Let cool for at least 4 hours.',
        ],
      },
      {
        id: 'ragu',
        title: 'Ragù',
        ingredients: [
          ingredient('olive-oil', 'Olive oil', '2', 'tbsp'),
          ingredient('celery', 'Celery stalks', '3', '', 'Cut into 1 cm dice'),
          ingredient('carrots', 'Carrots', '2', '', 'Cut into 1 cm dice'),
          ingredient('onion', 'Small red onion', '1', '', 'Cut into 1 cm dice'),
          ingredient('pork', 'Pork', '300', 'g', 'Minced by hand, not ground'),
          ingredient('tomato-paste', 'Tomato paste', '3', 'tbsp'),
          ingredient('wine', 'White wine', '250', 'ml'),
          ingredient('passata', 'Tomato passata', '700', 'g'),
          ingredient('peas', 'Frozen peas', '1', 'cup', 'Or more'),
          ingredient('salt', 'Salt', 'to taste'),
          ingredient(
            'pepper',
            'Black pepper',
            'to taste',
            '',
            'Freshly ground',
          ),
        ],
        steps: [
          'Soften the diced celery, carrot, and onion in the olive oil, then add the minced pork.',
          'Stir in the tomato paste, then deglaze with the white wine.',
          'Add the passata, a generous sprinkle of salt, and a good couple of grinds of black pepper. Simmer for 1–2 hours.',
          'When the sauce is nearly done, stir in the peas. The finished sauce should be very thick. Let cool.',
        ],
      },
      {
        id: 'bechamel',
        title: 'Béchamel',
        ingredients: [
          ingredient('roux-butter', 'Butter', '1/2', 'tbsp'),
          ingredient('flour', 'Flour', '2', 'tsp'),
          ingredient('milk', 'Milk', '160', 'ml'),
        ],
        steps: [
          'Make a roux with the butter and flour. When pale gold, slowly stir in the milk until creamy. Let cool.',
        ],
      },
      {
        id: 'filling',
        title: 'Finish the filling',
        ingredients: [
          ingredient(
            'grated-cheese',
            'Caciocavallo',
            '50',
            'g',
            'Grated; aged provolone may be substituted',
          ),
        ],
        steps: [
          'Combine the cooled ragù and béchamel, then stir in the grated cheese.',
        ],
      },
      {
        id: 'assemble',
        title: 'Assemble',
        ingredients: [
          ingredient(
            'cubed-cheese',
            'Caciocavallo',
            '150',
            'g',
            'Cut into 1–2 cm cubes; or aged provolone',
          ),
        ],
        steps: [
          'Spread a layer of rice over one palm. Add a few cheese cubes, a spoonful of filling, and a little more cheese.',
          'Cover with another palmful of rice. Bring your hands together in a prayer position to enclose the filling and form a cone.',
        ],
      },
      {
        id: 'coat',
        title: 'Coat',
        ingredients: [
          ingredient('eggs', 'Eggs', '4', '', 'Beaten'),
          ingredient(
            'breadcrumbs',
            'Fine breadcrumbs',
            'as needed',
            '',
            'A generous amount',
          ),
        ],
        steps: [
          'Gently spoon beaten egg over each arancino until covered.',
          'Spoon breadcrumbs over the surface, then press firmly to form an even coating.',
        ],
      },
      {
        id: 'fry',
        title: 'Fry',
        ingredients: [
          ingredient(
            'neutral-oil',
            'Neutral oil',
            'as needed',
            '',
            'For frying; mixed with lard',
          ),
          ingredient(
            'lard',
            'Lard',
            'as needed',
            '',
            'For frying; mixed with neutral oil',
          ),
        ],
        steps: [
          'Heat the mixture of lard and neutral oil to 175–190 °C. Fry the arancini until golden brown and crunchy, about 10 minutes.',
        ],
      },
    ],
  },
];
