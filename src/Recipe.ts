import { CategoryKeys } from "./components/SelectForCategory";

interface RecipeDataBase {
  name: string;
  category: CategoryKeys | "";
  directions: string;
  ingredients: string[];
  isPublished: boolean;

  imageUrl: string;
}

export interface RecipeData extends RecipeDataBase {
  publishDate: Date;
}

export interface RecipeDataWithNumberDate extends RecipeDataBase {
  publishDate: number;
}

export interface Recipe extends RecipeData {
  id: string;
}

export interface RecipeWithNumberDate extends RecipeDataWithNumberDate {
  id: string;
}
