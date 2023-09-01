import { CategoryKeys } from "./components/SelectForCategory";

export type RecipeData = {
  name: string;
  category: CategoryKeys | "";
  directions: string;
  ingredients: string[];
  isPublished: boolean;
  publishDate: Date;
  imageUrl: string;
};

export type Recipe = RecipeData & {
  id: string;
};

export type Recipes = Recipe[];
