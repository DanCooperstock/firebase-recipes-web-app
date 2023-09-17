/* eslint-disable operator-linebreak */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import { Express, Request, Response } from "express";
import express = require("express");
import {
  authorizeUser,
  sanitizeRecipePostPut,
  validateRecipePostPut,
} from "./utilities";
const bodyParser = require("body-parser");
const cors = require("cors");

import { auth, firestore } from "./FirebaseConfig";
import {
  DocumentData,
  DocumentReference,
  OrderByDirection,
  Query,
} from "firebase-admin/firestore";
import {
  RecipeDataWithNumberDate,
  RecipeDataWithRealDate,
  RecipeWithNumberDate,
} from "./Recipe";
// import { Utilities } from "./utilities";

const app: Express = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// Check authorization from header; send response and return false on
// missing or auth failure; return true on success
const checkAuth = async (
  request: Request,
  response: Response
): Promise<boolean> => {
  const authorizationHeader = request.headers["authorization"];
  if (!authorizationHeader) {
    response.status(401).send("Missing authorization header");
    return false;
  }

  try {
    await authorizeUser(authorizationHeader, auth);
  } catch (error: any) {
    response.status(401).send(error.message);
    return false;
  }
  return true;
};

// Validate and sanitize a recipe from a request body; return the recipe or null
const validateRecipe = (
  request: Request,
  response: Response
): RecipeDataWithRealDate | null => {
  const newRecipe = request.body;
  const missingFields = validateRecipePostPut(newRecipe);
  if (missingFields) {
    response
      .status(400)
      .send(
        `Recipe is not valid. Missing/invalid fields: ${missingFields.trim()}`
      );
    return null;
  }

  return sanitizeRecipePostPut(newRecipe);
};

// Restful CRUD web API endpoints:

// Update a recipe
app.post("/recipes", async (request: Request, response: Response) => {
  if (!checkAuth(request, response)) return;

  const recipe = validateRecipe(request, response);
  if (recipe === null) return;

  try {
    const firestoreResponse: DocumentReference<DocumentData> = await firestore
      .collection("recipes")
      .add(recipe);
    const recipeId = firestoreResponse.id;
    response.status(201).send({ id: recipeId });
  } catch (error: any) {
    response.status(400).send(error.message);
    return;
  }
});

// Retrieve some or all receipes depending on query string etc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.get("/recipes", async (request: Request, response: Response) => {
  const authorizationHeader = request.headers["authorization"]
    ? request.headers["authorization"]
    : "";
  const queryObject = request.query;
  const category = queryObject["category"] ? queryObject["category"] : "";
  const orderByField = queryObject["orderByField"]
    ? (queryObject["orderByField"] as string)
    : "";
  const orderByDirection: OrderByDirection = queryObject["orderByDirection"]
    ? (queryObject["orderByDirection"] as OrderByDirection)
    : "asc";
  const pageNumber = queryObject["pageNumber"]
    ? Number(queryObject["pageNumber"])
    : 0;
  const perPage = queryObject["perPage"] ? Number(queryObject["perPage"]) : 0;

  let isAuth = false;
  let collectionRef: Query = firestore.collection("recipes");

  try {
    await authorizeUser(authorizationHeader, auth);
    isAuth = true;
  } catch (error) {
    // un-logged in user can view unpublished recipes!
    collectionRef = collectionRef.where("isPublished", "==", true);
  }
  if (category) collectionRef = collectionRef.where("category", "==", category);
  if (orderByField) {
    collectionRef = collectionRef.orderBy(orderByField, orderByDirection);
  }
  if (perPage) {
    collectionRef = collectionRef.limit(perPage);
    if (pageNumber > 0) {
      collectionRef = collectionRef.offset((pageNumber - 1) * perPage);
    }
  }

  let recipeCount = 0;

  const countDocRef = firestore
    .collection("recipeCounts")
    .doc(isAuth ? "all" : "published");
  const countDoc = await countDocRef.get();
  if (countDoc.exists) {
    const countDocData = countDoc.data();
    if (countDocData) recipeCount = countDocData.count;
  }

  try {
    const firestoreResponse = collectionRef.get();
    const fetchedRecipes: RecipeWithNumberDate[] = (
      await firestoreResponse
    ).docs.map((recipe) => {
      const id = recipe.id;
      const data = recipe.data();
      data.publishDate = data.publishDate._seconds;

      return { ...(data as RecipeDataWithNumberDate), id };
    });

    const payload = { recipeCount, isAuth, documents: fetchedRecipes };
    response.status(200).send(payload);
  } catch (error: any) {
    response.status(400).send(error.message);
  }
});

// Replace a recipe
app.put("/recipes/:id", async (request: Request, response: Response) => {
  if (!checkAuth(request, response)) return;

  const id = request.params.id;

  const recipe = validateRecipe(request, response);
  if (recipe === null) return;

  try {
    await firestore.collection("recipes").doc(id).set(recipe);
    response.status(200).send({ id });
  } catch (error: any) {
    response.status(400).send(error.message);
  }
});

// Delete a recipe
app.delete("/recipes/:id", async (request: Request, response: Response) => {
  if (!checkAuth(request, response)) return;

  const id = request.params.id;

  try {
    await firestore.collection("recipes").doc(id).delete();
    response.status(200).send();
  } catch (error: any) {
    response.status(400).send(error.message);
  }
});

if (process.env.NODE_ENV != "production") {
  // Local dev:
  // app.listen(3005, () => {
  //   console.log("API started");
  // });
}

module.exports = app;
