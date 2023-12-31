import { useState, useEffect, startTransition, ChangeEvent } from "react";
import React from "react";
import FirebaseAuthService from "./FirebaseAuthService";
import "./App.css";
import LoginForm from "./components/LoginForm";
import AddEditRecipeForm from "./components/AddEditRecipeForm";
import FirebaseFirestoreRestService, {
  Query,
} from "./FirebaseFirestoreRestService";
import SelectForCategory, {
  lookupCategoryLabel,
} from "./components/SelectForCategory";
import {
  Recipe,
  RecipeDataWithNumberDate,
  RecipeWithNumberDate,
} from "./Recipe";
import firebase from "./FirebaseConfig";
import { alertAndThrow, getErrorMessage } from "./errors";

function App() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderBy, setOrderBy] = useState("publishDateDesc");
  const [recipesPerPage, setRecipesPerPage] = useState(3);
  const [isLastPage, setIsLastPage] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

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
  }, [user, categoryFilter, orderBy, recipesPerPage, currentPage]);

  async function fetchRecipes(cursorID = ""): Promise<Recipe[]> {
    const queries: Query[] = [];

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
    let orderByDirection: firebase.firestore.OrderByDirection | undefined;

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
    let fetchedRecipes: Recipe[] = [];
    try {
      const response = await FirebaseFirestoreRestService.readDocuments({
        collection: "recipes",
        queries,
        orderByField,
        orderByDirection,
        perPage: recipesPerPage,
        pageNumber: currentPage,
      });
      if (response && response.documents) {
        setTotalPages(Math.ceil(response.recipeCount / recipesPerPage));

        const nextPageResponse =
          await FirebaseFirestoreRestService.readDocuments({
            collection: "recipes",
            queries,
            orderByField,
            orderByDirection,
            perPage: recipesPerPage,
            pageNumber: currentPage + 1,
          });
        setIsLastPage(
          nextPageResponse &&
            nextPageResponse.documents &&
            nextPageResponse.documents.length === 0
        );

        if (response.documents.length === 0 && currentPage !== 1) {
          startTransition(() => {
            setCurrentPage(currentPage - 1);
          });
        }
        fetchedRecipes = response.documents.map(
          (recipe: RecipeWithNumberDate) => {
            return {
              id: recipe.id,
              name: recipe.name,
              category: recipe.category,
              directions: recipe.directions,
              ingredients: recipe.ingredients,
              isPublished: recipe.isPublished,
              publishDate: new Date(recipe.publishDate * 1000),
              imageUrl: recipe.imageUrl,
            };
          }
        );
      }
    } catch (error) {
      console.error(getErrorMessage(error));
      throw error;
    }
    return fetchedRecipes;
  }

  function handleRecipesPerPageChange(event: ChangeEvent<HTMLSelectElement>) {
    const recipesPerPage = +event.target.value;
    startTransition(() => {
      setRecipes([]);
      setRecipesPerPage(recipesPerPage);
    });
  }

  // function handleLoadMoreRecipesClick() {
  //   const lastRecipe = recipes[recipes.length - 1];
  //   const cursorID = lastRecipe.id;
  //   handleFetchRecipes(cursorID);
  // }

  async function handleFetchRecipes(cursorID = "") {
    try {
      const fetchedRecipes = await fetchRecipes(cursorID);
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error(getErrorMessage(error));
      throw error;
    }
  }

  FirebaseAuthService.subscribeToAuthChanges(setUser);

  async function handleAddRecipe(newRecipe: RecipeDataWithNumberDate) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await FirebaseFirestoreRestService.createDocument(
        "recipes",
        newRecipe
      );
      handleFetchRecipes();
      alert(`Recipe for "${newRecipe.name}" created successfully.`);
    } catch (error) {
      alert(getErrorMessage(error));
    }
  }

  async function handleUpdateRecipe(
    newRecipe: RecipeDataWithNumberDate,
    recipeId: string
  ) {
    try {
      await FirebaseFirestoreRestService.updateDocument(
        "recipes",
        recipeId,
        newRecipe
      );
      handleFetchRecipes(); // redisplay changes
      alert(`Successfully updated recipe for "${newRecipe.name}".`);
      startTransition(() => {
        setCurrentRecipe(null);
      });
    } catch (error) {
      alertAndThrow(error);
    }
  }

  /**
   * @param {string} recipeId
   */
  async function handleDeleteRecipe(recipeId: string) {
    const selected: Recipe | undefined = recipes.find(
      (recipe) => recipe.id === recipeId
    );
    if (selected === undefined) return;
    if (
      !window.confirm(`Is it OK to delete the recipe for "${selected.name}"?`)
    )
      return;
    try {
      await FirebaseFirestoreRestService.deleteDocument("recipes", recipeId);
      handleFetchRecipes(); // redisplay changes
      alert(`Successfully deleted recipe for "${selected.name}".`);
      startTransition(() => {
        setCurrentRecipe(null);
      });
      window.scrollTo(0, 0); // back to top
    } catch (error) {
      alertAndThrow(error);
    }
  }

  function handleEditRecipeClick(recipeId: string) {
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
                        Publish Date:{" "}
                        {recipe.publishDate.toISOString().split("T")[0]}
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
              {/* <button
                type="button"
                onClick={handleLoadMoreRecipesClick}
                className="primary-button"
              >
                LOAD MORE RECIPES
              </button> */}
              <div className="row">
                <button
                  className={
                    currentPage === 1
                      ? "primary-button hidden"
                      : "primary-button"
                  }
                  type="button"
                  onClick={() =>
                    startTransition(() => {
                      setCurrentPage(currentPage - 1);
                    })
                  }
                >
                  Previous
                </button>
                <div>Page {currentPage}</div>
                <button
                  className={
                    isLastPage ? "primary-button hidden" : "primary-button"
                  }
                  type="button"
                  onClick={() =>
                    startTransition(() => {
                      setCurrentPage(currentPage + 1);
                    })
                  }
                >
                  Next
                </button>
              </div>
              <div className="row">
                {!categoryFilter
                  ? new Array(totalPages).fill(0).map((value, index) => {
                      return (
                        <button
                          key={index + 1}
                          type="button"
                          className={
                            currentPage === index + 1
                              ? "selected-page primary-button page-button"
                              : "primary-button page-button"
                          }
                          onClick={() =>
                            startTransition(() => {
                              setCurrentPage(index + 1);
                            })
                          }
                        >
                          {index + 1}
                        </button>
                      );
                    })
                  : null}
              </div>
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
