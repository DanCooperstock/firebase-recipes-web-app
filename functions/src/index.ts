/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { functions, firestore, admin, storageBucket } from "./FirebaseConfig";
import { RecipeData } from "./Recipe";
import { Change, RuntimeOptions } from "firebase-functions/v1";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const recipesApi = require("./recipesApi");

exports.api = functions.https.onRequest(recipesApi);

const updateOneCount = async (
  docId: string,
  increment: number,
  valueIfMissing: number
) => {
  const countDocRef = firestore.collection("recipeCounts").doc(docId);
  const countDoc = await countDocRef.get();
  if (countDoc.exists) {
    countDocRef.update({
      count: admin.firestore.FieldValue.increment(increment),
    });
  } else {
    countDocRef.set({ count: valueIfMissing });
  }
};

const updateBothCounts = async (
  isPublished: boolean,
  increment: number,
  valueIfMissing: number
) => {
  updateOneCount("all", increment, valueIfMissing);
  if (isPublished) {
    updateOneCount("published", increment, valueIfMissing);
  }
};

exports.onCreateRecipe = functions.firestore
  .document("recipes/{recipeId}")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .onCreate(async (snapshot: QueryDocumentSnapshot<DocumentData>) => {
    const recipe: RecipeData = snapshot.data() as RecipeData;
    updateBothCounts(recipe.isPublished, 1, 1);
  });

exports.onDeleteRecipe = functions.firestore
  .document("recipes/{recipeId}")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .onDelete(async (snapshot: QueryDocumentSnapshot<DocumentData>) => {
    const recipe: RecipeData = snapshot.data() as RecipeData;
    const imageUrl = recipe.imageUrl;

    if (imageUrl) {
      const decodedUrl = decodeURIComponent(imageUrl);
      const startIndex = decodedUrl.indexOf("/o/") + 3;
      const endIndex = decodedUrl.indexOf("?");
      const fullFilePath = decodedUrl.substring(startIndex, endIndex);
      const file = storageBucket.file(fullFilePath);

      console.log(`Attempting to delete ${fullFilePath}`);
      try {
        await file.delete();
        console.log(`Successfully deleted ${fullFilePath}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.log(`Failed to delete ${fullFilePath}: ${error.message}`);
      }
    }
    updateBothCounts(recipe.isPublished, -1, 0);
  });

exports.onUpdateRecipe = functions.firestore
  .document("recipes/{recipeId}")
  .onUpdate(async (changes: Change<QueryDocumentSnapshot>) => {
    const oldRecipe: RecipeData = changes.before.data() as RecipeData;
    const newRecipe: RecipeData = changes.after.data() as RecipeData;

    let publishCountChange = 0;
    if (oldRecipe.isPublished !== newRecipe.isPublished) {
      publishCountChange = newRecipe.isPublished ? 1 : -1;
      updateOneCount(
        "published",
        publishCountChange,
        publishCountChange > 0 ? publishCountChange : 0
      );
    }
  });

const runtimeOptions: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: "256MB",
};

exports.dailyRecipePublishCheck = functions
  .runWith(runtimeOptions)
  .pubsub.schedule("0 0 * * *") /* midnight every day, from crontab.guru*/
  .onRun(async () => {
    console.log("dailyRecipePublishCheck called");
    const snapshot = await firestore
      .collection("recipes")
      .where("isPublished", "==", false)
      .get();
    snapshot.forEach(async (doc: QueryDocumentSnapshot<DocumentData>) => {
      const recipe: RecipeData = doc.data() as RecipeData;
      const now = Date.now() / 1000;
      const isPublished = recipe.publishDate._seconds <= now ? true : false;
      if (isPublished) {
        console.log(`Recipe ${recipe.name} is now published`);
        firestore
          .collection("recipes")
          .doc(doc.id)
          .set({ isPublished: true }, { merge: true });
      }
    });
  });

console.log("SERVER STARTED");
