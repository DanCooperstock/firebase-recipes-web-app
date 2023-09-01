import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useState,
} from "react";
import React from "react";
import SelectForCategory, { CategoryKeys } from "./SelectForCategory";
import ImageUploadPreview from "./ImageUploadPreview";
import { Recipe, RecipeData } from "../Recipe";

type AddEditRecipeFormProps = {
  existingRecipe: Recipe | null;
  handleAddRecipe: (arg0: RecipeData) => Promise<void>;
  handleUpdateRecipe: (arg0: RecipeData, arg1: string) => Promise<void>;
  handleEditRecipeCancel: () => void;
  handleDeleteRecipe: (arg0: string) => Promise<void>;
};

export default function AddEditRecipeForm({
  existingRecipe,
  handleAddRecipe,
  handleUpdateRecipe,
  handleEditRecipeCancel,
  handleDeleteRecipe,
}: AddEditRecipeFormProps) {
  useEffect(() => {
    if (existingRecipe) {
      setName(existingRecipe.name);
      setCategory(existingRecipe.category);
      setPublishDate(existingRecipe.publishDate.toISOString().split("T")[0]);
      setDirections(existingRecipe.directions);
      setIngredients(existingRecipe.ingredients);
      setImageUrl(existingRecipe.imageUrl);
    } else {
      resetForm();
    }
  }, [existingRecipe]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryKeys | "">("");
  const [publishDate, setPublishDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [directions, setDirections] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientName, setIngredientName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleAddIngredientKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key && e.key !== "Enter") return;
    e.preventDefault();
    handleAddIngredientCommon();
  };

  const handleAddIngredientClick = (e: MouseEvent) => {
    e.preventDefault();
    handleAddIngredientCommon();
  };

  const handleAddIngredientCommon = () => {
    if (!ingredientName) {
      alert("Please enter an ingredient before clicking Add Ingredient.");
      return;
    }
    setIngredients([...ingredients, ingredientName]);
    setIngredientName("");
  };

  const showIngredientRow = (ingredient: string, index: number) => {
    return (
      <tr key={index}>
        <td className="table-data text-center">{ingredient}</td>
        <td className="ingredient-delete-box">
          <button
            type="button"
            className="secondary-button ingredient-delete-button"
            // @ts-ignore
            onClick={(e) => setIngredients(ingredients.toSpliced(index, 1))}
          >
            Delete
          </button>
        </td>
      </tr>
    );
  };

  const handleRecipeFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (ingredients.length === 0) {
      alert("Your recipe needs some ingredients before you can save it.");
      return;
    }
    if (!imageUrl) {
      alert("Missing recipe image. Please add an image.");
      return;
    }
    const isPublished = new Date(publishDate) <= new Date();
    const newRecipe: RecipeData = {
      name,
      category,
      directions,
      publishDate: new Date(publishDate),
      isPublished,
      ingredients,
      imageUrl,
    };
    if (existingRecipe) {
      handleUpdateRecipe(newRecipe, existingRecipe.id);
    } else {
      handleAddRecipe(newRecipe);
    }

    resetForm();
  };

  function resetForm() {
    setName("");
    setCategory("");
    setPublishDate(new Date().toISOString().split("T")[0]);
    setDirections("");
    setIngredients([]);
    setImageUrl("");
  }

  return (
    <form
      className="add-edit-recipe-form-container"
      onSubmit={handleRecipeFormSubmit}
    >
      <h2>{existingRecipe ? "Update the" : "Add a New"} Recipe</h2>
      <div className="top-form-section">
        <div className="image-input-box">
          Recipe Image
          <ImageUploadPreview
            basePath="recipes"
            existingImageUrl={imageUrl}
            handleUploadFinish={(downloadUrl) => setImageUrl(downloadUrl)}
            handleUploadCancel={() => setImageUrl("")}
          />
        </div>
        <div className="fields">
          <label className="recipe-label input-label">
            Recipe Name:
            <input
              type="text"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              className="input-text"
            />
          </label>
          <SelectForCategory
            category={category as string}
            setCategoryFromEvent={(e: ChangeEvent<HTMLSelectElement>) =>
              setCategory(e.target.value as CategoryKeys)
            }
          />
          <label className="recipe-label input-label">
            Directions:
            <textarea
              value={directions}
              required
              onChange={(e) => setDirections(e.target.value)}
              className="input-text directions"
            />
          </label>
          <label className="recipe-label input-label">
            Publish Date:
            <input
              type="text"
              value={publishDate}
              required
              onChange={(e) => setPublishDate(e.target.value)}
              className="input-text"
            />
          </label>
        </div>
      </div>
      <div className="ingredients-list">
        <h3 className="text-center">Ingredients</h3>
        <table className="ingredients-table">
          <thead>
            <tr>
              <th className="table-header">Ingredient</th>
              <th className="table-header">Delete</th>
            </tr>
          </thead>
          <tbody>
            {ingredients && ingredients.length > 0
              ? ingredients.map(showIngredientRow)
              : null}
          </tbody>
        </table>
        {ingredients && ingredients.length === 0 ? (
          <h3 className="text-center no-ingredients">
            No ingredients added yet
          </h3>
        ) : null}
      </div>
      <div className="ingredient-form">
        <label className="ingredient-label">
          Ingredient:
          <input
            type="text"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            onKeyPress={handleAddIngredientKey}
            className="input-text"
            placeholder="Ex.: 1 cup of sugar"
          />
        </label>
        <button
          type="button"
          onClick={handleAddIngredientClick}
          className="primary-button add-ingredient-button"
        >
          Add Ingredient
        </button>
      </div>
      <div className="action-buttons">
        <button type="submit" className="primary-button action-button">
          {existingRecipe ? "Update" : "Create"} Recipe
        </button>
        {existingRecipe ? (
          <>
            <button
              type="button"
              className="primary-button action-button"
              onClick={handleEditRecipeCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button action-button"
              onClick={() => handleDeleteRecipe(existingRecipe.id)}
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}
