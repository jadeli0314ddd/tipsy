export type DrinkCategory = 'All' | 'Beer' | 'Wine' | 'Cocktails' | 'Spirits / Highballs' | 'Shots' | 'My Drinks';

export interface Drink {
  id: string;
  name: string;
  category: DrinkCategory;
  abv: number; // Alcohol By Volume (percentage, e.g., 5 for 5%)
  volume_ml: number;
  alcohol_ml: number;
  icon: string;
  is_favorite: boolean;
  is_pinned: boolean;
  is_custom?: boolean;
}

export interface DrinkLog {
  id: string;
  drink_id: string;
  timestamp: number;
  session_id: string; // To group drinks by night
}

export interface Selfie {
  id: string;
  timestamp: number;
  image_url: string;
  session_id: string;
}

export interface UserProfile {
  username: string;
  email: string;
  age: number;
  weight_kg: number;
  gender: 'male' | 'female';
  tolerance_type: 'auto' | 'manual';
  manual_tolerance: 'low' | 'medium' | 'high';
  enable_selfie_reminder: boolean;
}
