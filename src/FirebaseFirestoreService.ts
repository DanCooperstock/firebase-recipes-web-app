import firebase from "./FirebaseConfig";
import { Recipe } from "./Recipe";

const firestore = firebase.firestore();

export type Query = {
  field: string;
  condition: firebase.firestore.WhereFilterOp;
  value: any;
};

export type Queries = Query[];

const createDocument = (collection: string, document: any) => {
  return firestore.collection(collection).add(document);
};

const readDocument = (collection: string, cursorID: string) => {
  return firestore.collection(collection).doc(cursorID).get();
};

type ReadDocumentsProps = {
  collection: string;
  queries: Queries;
  orderByField: string;
  orderByDirection: firebase.firestore.OrderByDirection | undefined;
  perPage: number;
  cursorID: string;
};

// Return a promise for the results of a retrieval of a collection,
// with optional queries applied as where clauses
const readDocuments = async ({
  collection,
  queries,
  orderByField,
  orderByDirection,
  perPage,
  cursorID,
}: ReadDocumentsProps) => {
  let collectionRef: firebase.firestore.Query = firestore.collection(collection);
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
const updateDocument = (collection: string, id: string, document: any) => {
  return firestore.collection(collection).doc(id).update(document);
};

const deleteDocument = (collection: string, id: string) => {
  return firestore.collection(collection).doc(id).delete();
};

const FirebaseFirestoreService = {
  createDocument,
  readDocuments,
  updateDocument,
  deleteDocument,
};

export default FirebaseFirestoreService;
