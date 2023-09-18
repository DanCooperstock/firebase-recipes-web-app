import firebase from "./FirebaseConfig";
import { RecipeDataWithNumberDate } from "./Recipe";
import { alertAndThrow } from "./errors";

const auth = firebase.auth();
const BASE_URL = process.env.REACT_APP_API_URL;

const getToken = async (failOk: boolean): Promise<string | undefined> => {
  // alert(`base url: ${BASE_URL}`); // testing!
  try {
    return await auth.currentUser?.getIdToken();
  } catch (error) {
    if (!failOk) alertAndThrow(error);
    return undefined;
  }
};

const createDocument = async (
  collection: string,
  document: RecipeDataWithNumberDate
) => {
  const token = await getToken(false);

  try {
    const response = await fetch(`${BASE_URL}/${collection}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(document),
    });
    if (response.status !== 201) {
      const errorMessage = await response.text();
      const error = { message: errorMessage };
      throw error;
    }
    return response.json();
  } catch (error) {
    alertAndThrow(error);
  }
};

type Query = { field: string; value: string };

type ReadDocumentsArgs = {
  collection: string;
  queries: Query[];
  orderByField: string;
  orderByDirection: string | undefined;
  perPage?: number;
  pageNumber?: number;
};

const readDocuments = async (arg: ReadDocumentsArgs) => {
  try {
    const url = new URL(`${BASE_URL}/${arg.collection}`);
    for (const query of arg.queries) {
      url.searchParams.append(query.field, query.value);
    }
    if (arg.orderByField) {
      url.searchParams.append("orderByField", arg.orderByField);
    }
    if (arg.orderByDirection) {
      url.searchParams.append("orderByDirection", arg.orderByDirection);
    }
    if (arg.perPage) {
      url.searchParams.append("perPage", arg.perPage.toString());
    }
    if (arg.pageNumber) {
      url.searchParams.append("pageNumber", arg.pageNumber.toString());
    }

    const token = await getToken(true);
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status !== 200) {
      const errorMessage = await response.text();
      const error = { message: errorMessage };
      throw error;
    }
    return response.json();
  } catch (error) {
    alertAndThrow(error);
  }
};

const updateDocument = async (
  collection: string,
  id: string,
  document: RecipeDataWithNumberDate
) => {
  const token = await getToken(false);

  try {
    const response = await fetch(`${BASE_URL}/${collection}/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(document),
    });
    if (response.status !== 200) {
      const errorMessage = await response.text();
      const error = { message: errorMessage };
      throw error;
    }
    return response.json();
  } catch (error) {
    alertAndThrow(error);
  }
};

const deleteDocument = async (collection: string, id: string) => {
  const token = await getToken(false);

  try {
    const response = await fetch(`${BASE_URL}/${collection}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (response.status !== 200) {
      const errorMessage = await response.text();
      const error = { message: errorMessage };
      throw error;
    }
  } catch (error) {
    alertAndThrow(error);
  }
};

const FirebaseFirestoreRestService = {
  createDocument,
  readDocuments,
  updateDocument,
  deleteDocument,
};
export default FirebaseFirestoreRestService;
