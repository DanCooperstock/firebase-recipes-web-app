export type RecipeData = {
  name: string;
  category: string;
  directions: string;
  ingredients: string[];
  isPublished: boolean;
  publishDate: { _seconds: number };
  imageUrl: string;
};

export type RecipeDataWithNumberDate = {
  name: string;
  category: string;
  directions: string;
  ingredients: string[];
  isPublished: boolean;
  publishDate: number;
  imageUrl: string;
};

export type RecipeDataWithRealDate = {
  name: string;
  category: string;
  directions: string;
  ingredients: string[];
  isPublished: boolean;
  publishDate: Date;
  imageUrl: string;
};

export type Recipe = RecipeData & { id: string };

export type RecipeWithNumberDate = RecipeDataWithNumberDate & { id: string };

export type RecipeDoc = { data: () => RecipeData; id: string };
