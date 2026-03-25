import { UserNotebook } from "../types";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { showErrorMessage, toUserFriendlyError } from "./errorMessageMap";

const AC = APPLICATION_CONSTANTS;

export const getNotebookFetch = async (notebookId: string) => {
  const note = { notebookID: notebookId };
  try {
    const response = await fetch("/api/db/get-notebook", {
      method: "POST",
      body: JSON.stringify(note),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      let serverMsg: string | undefined;
      try {
        const errData = (await response.json()) as { error?: string };
        if (typeof errData?.error === "string") {
          serverMsg = showErrorMessage(errData.error, true);
        }
      } catch {
        /* empty or non-JSON body */
      }
      throw new Error(
        serverMsg ??
          (response.status >= 500
            ? AC.ERROR_SERVER_UNREACHABLE
            : AC.NOTEBOOK_ERROR),
      );
    }
    const data = (await response.json()) as UserNotebook;
    if (data.error) {
      throw new Error(showErrorMessage(data.error, true));
    }
    return { Notebooks: data };
  } catch (error: unknown) {
    throw new Error(toUserFriendlyError(error));
  }
};

export const createUser = async (
  email: string,
  password: string,
  username: string,
) => {
  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        username,
        framework: APPLICATION_CONSTANTS.FRAMEWORK,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (data.error) {
      return data;
    }
    if (!response.ok) {
      throw new Error(AC.CREATE_USER_ERROR);
    }
    return data;
  } catch (error: unknown) {
    throw new Error(toUserFriendlyError(error));
  }
};

export const addNotebookFetch = async (
  notebook_name: string,
  notebook_cover: string,
) => {
  const notebook = {
    notebookName: notebook_name,
    notebookCover: notebook_cover,
  };

  let response: Response;
  try {
    response = await fetch("/api/db/add-notebook", {
      method: "POST",
      body: JSON.stringify(notebook),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(response.statusText || AC.NOTEBOOK_CREATE_ERROR);
    }
  } catch (error: unknown) {
    throw new Error(toUserFriendlyError(error));
  }

  let data: {
    error?: string;
    acknowledged?: boolean;
    added?: {
      _id: string;
      notebook_name: string;
      notebook_cover: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  try {
    data = await response.json();
    if (data.error) {
      throw new Error(showErrorMessage(data.error, true));
    }
  } catch (error: unknown) {
    throw new Error(toUserFriendlyError(error));
  }

  if (data.acknowledged && data.added) {
    return {
      success: true as const,
      notebook: {
        id: data.added._id,
        name: data.added.notebook_name,
        cover: data.added.notebook_cover,
        createdAt: data.added.createdAt,
        updatedAt: data.added.updatedAt,
      },
    };
  }
  throw new Error(AC.NOTEBOOK_CREATE_ERROR);
};
