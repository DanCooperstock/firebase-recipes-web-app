import firebase from "./FirebaseConfig";

const firestore = firebase.firestore();

const createDocument = (collection, document) => {
  return firestore.collection(collection).add(document);
};

const readDocument = (collection, cursorID) => {
  return firestore.collection(collection).doc(cursorID).get();
}


// Return a promise for the results of a retrieval of a collection,
// with optional queries applied as where clauses
const readDocuments = async ({
  collection,
  queries,
  orderByField,
  orderByDirection,
  perPage,
  cursorID,
}) => {
  let collectionRef = firestore.collection(collection);
  // add any queries
  if (queries && queries.length > 0) {
    for (const query of queries) {
      collectionRef = collectionRef.where(
        query.field,
        query.condition,
        query.value
      );
    }
  }
  if (orderByField && orderByDirection) {
    collectionRef = collectionRef.orderBy(orderByField, orderByDirection);
  }
  if (perPage) {
    collectionRef = collectionRef.limit(perPage);
  }
  if (cursorID) {
    const document = await readDocument(collection, cursorID);
    collectionRef = collectionRef.startAfter(document);
  }
  return collectionRef.get();
};

// Return a promise for an update
const updateDocument = (collection, id, document) => {
  return firestore.collection(collection).doc(id).update(document);
};

const deleteDocument = (collection, id) => {
  return firestore.collection(collection).doc(id).delete();
};

const FirebaseFirestoreService = {
  createDocument,
  readDocuments,
  updateDocument,
  deleteDocument,
};

export default FirebaseFirestoreService;
