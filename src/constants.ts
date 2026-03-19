import { Drink } from './types';

export const DEFAULT_DRINKS: Drink[] = [
  // Beer
  { id: 'beer', name: 'Beer', category: 'Beer', abv: 5, volume_ml: 330, alcohol_ml: 16.5, icon: '🍺', is_favorite: true, is_pinned: true },
  { id: 'lager', name: 'Lager', category: 'Beer', abv: 5, volume_ml: 330, alcohol_ml: 16.5, icon: '🍺', is_favorite: false, is_pinned: false },
  { id: 'ipa', name: 'IPA', category: 'Beer', abv: 6.5, volume_ml: 330, alcohol_ml: 21.45, icon: '🍺', is_favorite: false, is_pinned: false },
  { id: 'pale-ale', name: 'Pale Ale', category: 'Beer', abv: 5.5, volume_ml: 330, alcohol_ml: 18.15, icon: '🍺', is_favorite: false, is_pinned: false },
  { id: 'wheat-beer', name: 'Wheat Beer', category: 'Beer', abv: 5.2, volume_ml: 500, alcohol_ml: 26, icon: '🍺', is_favorite: false, is_pinned: false },
  { id: 'stout', name: 'Stout', category: 'Beer', abv: 6, volume_ml: 440, alcohol_ml: 26.4, icon: '🍺', is_favorite: false, is_pinned: false },
  { id: 'cider', name: 'Cider', category: 'Beer', abv: 4.5, volume_ml: 500, alcohol_ml: 22.5, icon: '🍎', is_favorite: false, is_pinned: false },
  { id: 'corona', name: 'Corona', category: 'Beer', abv: 4.5, volume_ml: 330, alcohol_ml: 14.85, icon: '🍺', is_favorite: false, is_pinned: false },
  { id: 'heineken', name: 'Heineken', category: 'Beer', abv: 5, volume_ml: 330, alcohol_ml: 16.5, icon: '🍺', is_favorite: false, is_pinned: false },
  { id: 'guinness', name: 'Guinness', category: 'Beer', abv: 4.2, volume_ml: 440, alcohol_ml: 18.48, icon: '🍺', is_favorite: false, is_pinned: false },

  // Wine
  { id: 'red-wine', name: 'Red Wine', category: 'Wine', abv: 13, volume_ml: 150, alcohol_ml: 19.5, icon: '🍷', is_favorite: true, is_pinned: false },
  { id: 'white-wine', name: 'White Wine', category: 'Wine', abv: 12, volume_ml: 150, alcohol_ml: 18, icon: '🥂', is_favorite: false, is_pinned: false },
  { id: 'rose-wine', name: 'Rosé', category: 'Wine', abv: 12, volume_ml: 150, alcohol_ml: 18, icon: '🍷', is_favorite: false, is_pinned: false },
  { id: 'cabernet', name: 'Cabernet Sauvignon', category: 'Wine', abv: 14, volume_ml: 150, alcohol_ml: 21, icon: '🍷', is_favorite: false, is_pinned: false },
  { id: 'chardonnay', name: 'Chardonnay', category: 'Wine', abv: 13, volume_ml: 150, alcohol_ml: 19.5, icon: '🥂', is_favorite: false, is_pinned: false },
  { id: 'pinot-noir', name: 'Pinot Noir', category: 'Wine', abv: 13, volume_ml: 150, alcohol_ml: 19.5, icon: '🍷', is_favorite: false, is_pinned: false },
  { id: 'sauvignon-blanc', name: 'Sauvignon Blanc', category: 'Wine', abv: 12.5, volume_ml: 150, alcohol_ml: 18.75, icon: '🥂', is_favorite: false, is_pinned: false },
  { id: 'champagne', name: 'Champagne', category: 'Wine', abv: 12, volume_ml: 125, alcohol_ml: 15, icon: '🥂', is_favorite: false, is_pinned: false },
  { id: 'prosecco', name: 'Prosecco', category: 'Wine', abv: 11, volume_ml: 125, alcohol_ml: 13.75, icon: '🥂', is_favorite: false, is_pinned: false },
  { id: 'sake', name: 'Sake', category: 'Wine', abv: 15, volume_ml: 180, alcohol_ml: 27, icon: '🍶', is_favorite: false, is_pinned: false },

  // Cocktails
  { id: 'mojito', name: 'Mojito', category: 'Cocktails', abv: 12, volume_ml: 300, alcohol_ml: 36, icon: '🍹', is_favorite: true, is_pinned: false },
  { id: 'margarita', name: 'Margarita', category: 'Cocktails', abv: 20, volume_ml: 150, alcohol_ml: 30, icon: '🍸', is_favorite: true, is_pinned: false },
  { id: 'martini', name: 'Martini', category: 'Cocktails', abv: 30, volume_ml: 100, alcohol_ml: 30, icon: '🍸', is_favorite: false, is_pinned: false },
  { id: 'negroni', name: 'Negroni', category: 'Cocktails', abv: 24, volume_ml: 120, alcohol_ml: 28.8, icon: '🥃', is_favorite: false, is_pinned: false },
  { id: 'aperol-spritz', name: 'Aperol Spritz', category: 'Cocktails', abv: 11, volume_ml: 200, alcohol_ml: 22, icon: '🍹', is_favorite: false, is_pinned: false },
  { id: 'old-fashioned', name: 'Old Fashioned', category: 'Cocktails', abv: 32, volume_ml: 100, alcohol_ml: 32, icon: '🥃', is_favorite: false, is_pinned: false },
  { id: 'long-island', name: 'Long Island Iced Tea', category: 'Cocktails', abv: 22, volume_ml: 300, alcohol_ml: 66, icon: '🥤', is_favorite: false, is_pinned: false },
  { id: 'cosmopolitan', name: 'Cosmopolitan', category: 'Cocktails', abv: 15, volume_ml: 150, alcohol_ml: 22.5, icon: '🍸', is_favorite: false, is_pinned: false },
  { id: 'whiskey-sour', name: 'Whiskey Sour', category: 'Cocktails', abv: 14, volume_ml: 150, alcohol_ml: 21, icon: '🥃', is_favorite: false, is_pinned: false },
  { id: 'pina-colada', name: 'Pina Colada', category: 'Cocktails', abv: 13, volume_ml: 300, alcohol_ml: 39, icon: '🍍', is_favorite: false, is_pinned: false },
  { id: 'bloody-mary', name: 'Bloody Mary', category: 'Cocktails', abv: 10, volume_ml: 300, alcohol_ml: 30, icon: '🍅', is_favorite: false, is_pinned: false },
  { id: 'espresso-martini', name: 'Espresso Martini', category: 'Cocktails', abv: 18, volume_ml: 150, alcohol_ml: 27, icon: '☕', is_favorite: false, is_pinned: false },
  { id: 'moscow-mule', name: 'Moscow Mule', category: 'Cocktails', abv: 11, volume_ml: 250, alcohol_ml: 27.5, icon: '🍺', is_favorite: false, is_pinned: false },
  { id: 'daiquiri', name: 'Daiquiri', category: 'Cocktails', abv: 20, volume_ml: 120, alcohol_ml: 24, icon: '🍸', is_favorite: false, is_pinned: false },
  { id: 'manhattan', name: 'Manhattan', category: 'Cocktails', abv: 30, volume_ml: 100, alcohol_ml: 30, icon: '🍸', is_favorite: false, is_pinned: false },

  // Spirits / Highballs
  { id: 'whiskey', name: 'Whiskey', category: 'Spirits / Highballs', abv: 40, volume_ml: 45, alcohol_ml: 18, icon: '🥃', is_favorite: true, is_pinned: false },
  { id: 'whiskey-soda', name: 'Whiskey Soda', category: 'Spirits / Highballs', abv: 12, volume_ml: 150, alcohol_ml: 18, icon: '🥃', is_favorite: false, is_pinned: false },
  { id: 'vodka-soda', name: 'Vodka Soda', category: 'Spirits / Highballs', abv: 10, volume_ml: 250, alcohol_ml: 25, icon: '🥤', is_favorite: true, is_pinned: false },
  { id: 'gin-tonic', name: 'Gin & Tonic', category: 'Spirits / Highballs', abv: 12, volume_ml: 200, alcohol_ml: 24, icon: '🍸', is_favorite: true, is_pinned: true },
  { id: 'rum-coke', name: 'Rum & Coke', category: 'Spirits / Highballs', abv: 12, volume_ml: 200, alcohol_ml: 24, icon: '🥤', is_favorite: false, is_pinned: false },
  { id: 'tequila', name: 'Tequila', category: 'Spirits / Highballs', abv: 40, volume_ml: 45, alcohol_ml: 18, icon: '🥃', is_favorite: false, is_pinned: false },
  { id: 'brandy', name: 'Brandy', category: 'Spirits / Highballs', abv: 40, volume_ml: 45, alcohol_ml: 18, icon: '🥃', is_favorite: false, is_pinned: false },
  { id: 'cognac', name: 'Cognac', category: 'Spirits / Highballs', abv: 40, volume_ml: 45, alcohol_ml: 18, icon: '🥃', is_favorite: false, is_pinned: false },
  { id: 'vodka-tonic', name: 'Vodka Tonic', category: 'Spirits / Highballs', abv: 12, volume_ml: 200, alcohol_ml: 24, icon: '🍸', is_favorite: false, is_pinned: false },
  { id: 'dark-stormy', name: 'Dark \'n\' Stormy', category: 'Spirits / Highballs', abv: 14, volume_ml: 200, alcohol_ml: 28, icon: '🍹', is_favorite: false, is_pinned: false },
  { id: 'paloma', name: 'Paloma', category: 'Spirits / Highballs', abv: 12, volume_ml: 250, alcohol_ml: 30, icon: '🍹', is_favorite: false, is_pinned: false },

  // Shots
  { id: 'tequila-shot', name: 'Tequila Shot', category: 'Shots', abv: 38, volume_ml: 30, alcohol_ml: 11.4, icon: '🍶', is_favorite: true, is_pinned: false },
  { id: 'vodka-shot', name: 'Vodka Shot', category: 'Shots', abv: 40, volume_ml: 30, alcohol_ml: 12, icon: '🍶', is_favorite: false, is_pinned: false },
  { id: 'whiskey-shot', name: 'Whiskey Shot', category: 'Shots', abv: 40, volume_ml: 30, alcohol_ml: 12, icon: '🍶', is_favorite: false, is_pinned: false },
  { id: 'jager-shot', name: 'Jäger Shot', category: 'Shots', abv: 35, volume_ml: 30, alcohol_ml: 10.5, icon: '🍶', is_favorite: false, is_pinned: false },
  { id: 'b52', name: 'B-52', category: 'Shots', abv: 27, volume_ml: 45, alcohol_ml: 12.15, icon: '🔥', is_favorite: false, is_pinned: false },
  { id: 'lemon-drop', name: 'Lemon Drop', category: 'Shots', abv: 25, volume_ml: 45, alcohol_ml: 11.25, icon: '🍋', is_favorite: false, is_pinned: false },
  { id: 'kamikaze', name: 'Kamikaze', category: 'Shots', abv: 25, volume_ml: 45, alcohol_ml: 11.25, icon: '🍶', is_favorite: false, is_pinned: false },
  { id: 'sambuca', name: 'Sambuca', category: 'Shots', abv: 38, volume_ml: 30, alcohol_ml: 11.4, icon: '🍶', is_favorite: false, is_pinned: false },
  { id: 'absinthe-shot', name: 'Absinthe Shot', category: 'Shots', abv: 70, volume_ml: 20, alcohol_ml: 14, icon: '🧚', is_favorite: false, is_pinned: false },
];

export const CATEGORIES: Drink['category'][] = [
  'All',
  'Beer',
  'Wine',
  'Cocktails',
  'Spirits / Highballs',
  'Shots',
  'My Drinks',
];
