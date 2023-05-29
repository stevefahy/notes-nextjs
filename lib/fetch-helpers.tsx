import { UserNotebook } from "../types";

export const getNotebookFetch = async (notebookId: string) => {
  const note = { notebookID: notebookId };
  let response;
  try {
    response = await fetch("/api/db/get-notebook", {
      method: "POST",
      body: JSON.stringify(note),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("An error occured fetching the notebook!");
    }
    const data = (await response.json()) as UserNotebook;
    if (data.error) {
      throw new Error("An error occured parsing the notebook!");
    }
    return { Notebooks: data };
  } catch (error: any) {
    throw new Error(error);
  }
};

export const createUser = async (
  email: string,
  password: string,
  username: string
) => {
  let response;
  try {
    response = await fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (data.error) {
      return data;
    }
    if (!response.ok) {
      throw new Error("Something went wrong!");
    }
    return data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const addNotebookFetch = async (
  notebook_name: string,
  notebook_cover: string
) => {
  const notebook = {
    notebookName: notebook_name,
    notebookCover: notebook_cover,
  };

  let response;
  let data;

  try {
    response = await fetch("/api/db/add-notebook", {
      method: "POST",
      body: JSON.stringify(notebook),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response || !response.ok) {
      throw new Error(
        response.statusText || "An error occured creating the notebook!"
      );
    }
  } catch (error: any) {
    throw new Error(error.message || `An error occured creating the notebook!`);
  }

  try {
    data = await response.json();
    if (data.error) {
      throw new Error(data.error || `Failed to parse notebook!`);
    }
  } catch (error: any) {
    throw new Error(error.message || `Failed to parse notebook!`);
  }

  if (data.error) {
    throw new Error(data.error || `Failed to parse notebooks!!`);
  }
  if (data.acknowledged) {
    return {
      success: true,
      notebook: {
        id: data.added._id,
        name: data.added.notebook_name,
        cover: data.added.notebook_cover,
        createdAt: data.added.createdAt,
        updatedAt: data.added.updatedAt,
      },
    };
  }
  throw new Error(`Unknown error creating notebook!`);
};
