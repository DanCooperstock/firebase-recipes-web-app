export interface RecipeDataBase {
  name: string;
  category: string;
  directions: string;
  ingredients: string[];
  isPublished: boolean;
  imageUrl: string;
}

export interface RecipeData extends RecipeDataBase {
  publishDate: { _seconds: number };
}

export interface RecipeDataWithNumberDate extends RecipeDataBase {
  publishDate: number;
}

export interface RecipeDataWithRealDate extends RecipeDataBase {
  publishDate: Date;
}

export interface Recipe extends RecipeData {
  id: string;
}

export interface RecipeWithNumberDate extends RecipeDataWithNumberDate {
  id: string;
}

export interface RecipeDoc {
  data: () => RecipeData;
  id: string;
}
