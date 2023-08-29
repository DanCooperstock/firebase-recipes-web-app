import { useState, useEffect, startTransition } from "react";
import React from "react";
import FirebaseAuthService from "./FirebaseAuthService";
import "./App.css";
import LoginForm from "./components/LoginForm";
import AddEditRecipeForm from "./components/AddEditRecipeForm";
import FirebaseFirestoreService from "./FirebaseFirestoreService";
import SelectForCategory, {
  lookupCategoryLabel,
} from "./components/SelectForCategory";

function App() {
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderBy, setOrderBy] = useState("publishDateDesc");
  const [recipesPerPage, setRecipesPerPage] = useState(3);

  useEffect(() => {
    setIsLoading(true);
    fetchRecipes()
      .then((fetchedRecipes) => {
        setRecipes(fetchedRecipes);
      })
      .catch((error) => {
        console.error(error.message);
        throw error;
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, categoryFilter, orderBy, recipesPerPage]);

  async function fetchRecipes(cursorID = "") {
    const queries = [];

    if (!user) {
      queries.push({
        field: "isPublished",
        condition: "==",
        value: true,
      });
    }
    if (categoryFilter) {
      queries.push({
        field: "category",
        condition: "==",
        value: categoryFilter,
      });
    }
    const orderByField = "publishDate";
    let orderByDirection;

    if (orderBy) {
      switch (orderBy) {
        case "publishDateAsc":
          orderByDirection = "asc";
          break;
        case "publishDateDesc":
          orderByDirection = "desc";
          break;
        default:
          break;
      }
    }
    let fetchedRecipes = [];
    try {
      const response = await FirebaseFirestoreService.readDocuments({
        collection: "recipes",
        queries,
        orderByField,
        orderByDirection: orderByDirection,
        perPage: recipesPerPage,
        cursorID,
      });
      const newRecipes = response.docs.map((recipeDoc) => {
        const id = recipeDoc.id;
        const data = recipeDoc.data();
        data.publishDate = new Date(data.publishDate.seconds * 1000);
        return { ...data, id };
      });
      if (cursorID) {
        fetchedRecipes = [...recipes, ...newRecipes];
      } else {
        fetchedRecipes = [...newRecipes];
      }
    } catch (error) {
      console.error(error.message);
      throw error;
    }
    return fetchedRecipes;
  }

  function handleRecipesPerPageChange(event) {
    const recipesPerPage = event.target.value;
    startTransition(() => {
      setRecipes([]);
      setRecipesPerPage(recipesPerPage);
    });
  }

  function handleLoadMoreRecipesClick() {
    const lastRecipe = recipes[recipes.length - 1];
    const cursorID = lastRecipe.id;
    handleFetchRecipes(cursorID);
  }

  async function handleFetchRecipes(cursorID = "") {
    try {
      const fetchedRecipes = await fetchRecipes(cursorID);
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  FirebaseAuthService.subscribeToAuthChanges(setUser);

  async function handleAddRecipe(newRecipe) {
    try {
      const response = await FirebaseFirestoreService.createDocument(
        "recipes",
        newRecipe
      );
      handleFetchRecipes();
      alert(`Recipe with ID ${response.id} created successfully.`);
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleUpdateRecipe(newRecipe, recipeId) {
    try {
      await FirebaseFirestoreService.updateDocument(
        "recipes",
        recipeId,
        newRecipe
      );
      handleFetchRecipes(); // redisplay changes
      alert(`Successfully updated recipe with ID ${recipeId}.`);
      startTransition(() => {
        setCurrentRecipe(null);
      });
    } catch (error) {
      alert(error.message);
      throw error;
    }
  }

  /**
   * @param {string} recipeId
   */
  async function handleDeleteRecipe(recipeId) {
    const selected = recipes.find((recipe) => recipe.id === recipeId);
    if (!window.confirm(`Is it OK to delete the recipe for ${selected.name}?`))
      return;
    try {
      await FirebaseFirestoreService.deleteDocument("recipes", recipeId);
      handleFetchRecipes(); // redisplay changes
      alert(`Successfully deleted recipe for ${selected.name}.`);
      startTransition(() => {
        setCurrentRecipe(null);
      });
      window.scrollTo(0, 0); // back to top
    } catch (error) {
      alert(error.message);
      throw error;
    }
  }

  function handleEditRecipeClick(recipeId) {
    const selected = recipes.find((recipe) => recipe.id === recipeId);
    if (selected) {
      startTransition(() => {
        setCurrentRecipe(selected);
      });
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }

  function handleEditRecipeCancel() {
    startTransition(() => {
      setCurrentRecipe(null);
    });
  }

  return (
    <div className="App">
      <div className="title-row">
        <h1 className="title">Firebase Recipes</h1>
        <LoginForm existingUser={user} />
      </div>
      <div className="main">
        <div className="row filters">
          <SelectForCategory
            category={categoryFilter}
            setCategoryFromEvent={(e) =>
              startTransition(() => {
                setCategoryFilter(e.target.value);
              })
            }
          />
          <label className="input-label">
            <select
              value={orderBy}
              onChange={(e) =>
                startTransition(() => setOrderBy(e.target.value))
              }
              className="select"
            >
              <option value="publishDateDesc">
                Publish Date (newest to oldest)
              </option>
              <option value="publishDateAsc">
                Publish Date (oldest to newest)
              </option>
            </select>
          </label>
        </div>
        <div className="center">
          <div className="recipe-list-box">
            {isLoading ? (
              <div className="fire">
                <div className="flames">
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flameÌ"></div>
                </div>
                <div className="logs"></div>
              </div>
            ) : null}
            {!isLoading && recipes && recipes.length === 0 ? (
              <h5 className="no-recipes">No recipes found</h5>
            ) : null}
            {!isLoading && recipes && recipes.length > 0 ? (
              <div className="recipe-list">
                {recipes.map((recipe) => {
                  return (
                    <div className="recipe-card" key={recipe.id}>
                      {!recipe.isPublished ? (
                        <div className="unpublished">UNPUBLISHED</div>
                      ) : null}
                      <div className="recipe-name">{recipe.name}</div>
                      <div className="recipe-image-box">
                        {recipe.imageUrl ? (
                          <img
                            src={recipe.imageUrl}
                            alt={recipe.name}
                            className="recipe-image"
                          />
                        ) : null}
                      </div>
                      <div className="recipe-field">
                        Category: {lookupCategoryLabel(recipe.category)}
                      </div>
                      <div className="recipe-field">
                        Publish Date: {recipe.publishDate.toLocaleDateString()}
                      </div>
                      {user ? (
                        <button
                          className="primary-button edit-button"
                          type="button"
                          onClick={(e) => handleEditRecipeClick(recipe.id)}
                        >
                          EDIT
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
        {isLoading || (recipes && recipes.length > 0) ? (
          <>
            <label className="input-label">
              Recipes per Page
              <select
                value={recipesPerPage}
                onChange={handleRecipesPerPageChange}
                className="select"
              >
                <option value="3">3</option>
                <option value="6">6</option>
                <option value="9">9</option>
              </select>
            </label>
            <div className="pagination">
              <button
                type="button"
                onClick={handleLoadMoreRecipesClick}
                className="primary-button"
              >
                LOAD MORE RECIPES
              </button>
            </div>
          </>
        ) : null}
        {user ? (
          <AddEditRecipeForm
            existingRecipe={currentRecipe}
            handleAddRecipe={handleAddRecipe}
            handleUpdateRecipe={handleUpdateRecipe}
            handleEditRecipeCancel={handleEditRecipeCancel}
            handleDeleteRecipe={handleDeleteRecipe}
          />
        ) : null}
      </div>
    </div>
  );
}

export default App;
