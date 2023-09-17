import { Auth } from "firebase-admin/auth";
import {
  RecipeData,
  RecipeDataWithNumberDate,
  RecipeDataWithRealDate,
} from "./Recipe";

const authorizeUser = async (
  authorizationHeader: string,
  firebaseAuth: Auth
) => {
  if (!authorizationHeader) {
    // eslint-disable-next-line no-throw-literal
    throw "no authorization provided!";
  }
  const token = authorizationHeader.split(" ")[1];
  // eslint-disable-next-line no-useless-catch
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw error;
  }
};

// Return any empty fields, or empty string for valid
const validateRecipePostPut = (newRecipe: RecipeData): string => {
  let misingFields = "";

  if (!newRecipe) {
    return "recipe";
  }
  if (!newRecipe.name) misingFields += "name ";
  if (!newRecipe.category) misingFields += "category ";
  if (!newRecipe.directions) misingFields += "directions ";
  if (newRecipe.isPublished !== true && newRecipe.isPublished !== false) {
    misingFields += "isPublished ";
  }
  if (!newRecipe.ingredients || newRecipe.ingredients.length === 0) {
    misingFields += "ingredients";
  }
  if (!newRecipe.publishDate) misingFields += "publishDate ";
  if (!newRecipe.imageUrl) misingFields += "imageUrl";

  return misingFields;
};

// Make sure the data we will use has only the expected fields, by making a copy
// with those fields. This also converts to a real Date for the publishDate.
const sanitizeRecipePostPut = (
  newRecipe: RecipeDataWithNumberDate
): RecipeDataWithRealDate => {
  const recipe: RecipeDataWithRealDate = {
    name: newRecipe.name,
    category: newRecipe.category,
    directions: newRecipe.directions,
    isPublished: newRecipe.isPublished,
    ingredients: newRecipe.ingredients,
    publishDate: new Date(newRecipe.publishDate * 1000),
    imageUrl: newRecipe.imageUrl,
  };

  return recipe;
};

export { authorizeUser, validateRecipePostPut, sanitizeRecipePostPut };
