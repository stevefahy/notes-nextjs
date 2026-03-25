import { getDb } from "./db";
import { ObjectId, Db } from "mongodb";
import { Notebook, Notebooks, Notes, NoteDBProps } from "../types";

// DB Helpers are called by pages using getServerSideProps

/* It can be tempting to reach for an API Route when you want to fetch data from the server,
 then call that API route from getServerSideProps. 
 This is an unnecessary and inefficient approach, 
 as it will cause an extra request to be made
  due to both getServerSideProps and API Routes running on the server.*/

// getNote, getNotes, getNotebooks, getNotebook

// getNote

export const getNote = async (user_ID: ObjectId, note_ID: string) => {
  if (!user_ID || user_ID === undefined) {
    throw new Error(`User not authenticated!`);
  }
  if (!note_ID || note_ID === undefined) {
    throw new Error(`Note ID missing!`);
  }

  const userID = new ObjectId(user_ID);
  const noteID = new ObjectId(note_ID);

  let db: Db;
  try {
    db = await getDb();
    if (db === undefined) {
      throw new Error(`Could not connect to the database!`);
    }
  } catch (error: any) {
    throw new Error(`${error}`);
  }

  const findNote = (userID: ObjectId, noteID: string | any) => {
    return new Promise(async (resolve, reject) => {
      try {
        db.collection("notes")
          .find({ user: userID, _id: noteID })
          .next()
          .then(
            (res) => {
              if (res === null) {
                reject(`Could not retrieve note!`);
              } else {
                resolve({ data: res });
              }
            },
            (err) => {
              if (err) {
                reject(err);
              }
            },
          );
      } catch (error) {
        reject(error);
      }
    });
  };

  try {
    const result = (await findNote(userID, noteID)) as NoteDBProps;
    if (result && result.data) {
      result.data._id = result.data._id.toString();
      result.data.notebook = result.data.notebook.toString();

      let createddate = "No date";
      let updateddate = "No date";
      if (result.data.createdAt) {
        createddate = result.data.createdAt?.toString();
      }
      if (result.data.updatedAt) {
        updateddate = result.data.updatedAt?.toString();
      }

      return {
        data: {
          _id: result.data._id,
          note: result.data.note,
          notebook: result.data.notebook,
          createdAt: createddate,
          updatedAt: updateddate,
        },
      };
    } else {
      return {
        data: {
          _id: "",
          notebook: "",
          note: "",
          createdAt: "",
          updatedAt: "",
        },
      };
    }
  } catch (error) {
    return {
      data: {
        _id: "",
        notebook: "",
        note: "",
        createdAt: "",
        updatedAt: "",
      },
      error: `${error}`,
    };
  }
};

// getNotes

export const getNotes = async (user_ID: ObjectId, notebook_ID: string) => {
  if (!user_ID || user_ID === undefined) {
    throw new Error(`User not authenticated!`);
  }
  if (!notebook_ID || notebook_ID === undefined) {
    throw new Error(`Notebook ID missing!`);
  }

  const userID = new ObjectId(user_ID);
  const notebookID = new ObjectId(notebook_ID);

  let db: Db;
  try {
    db = await getDb();
  } catch (error: any) {
    throw new Error(`Could not connect to the database!
    ${error}`);
  }

  const findNotes = (user_id: ObjectId, notebook_id: ObjectId) => {
    return new Promise(async (resolve, reject) => {
      try {
        db.collection("notes")
          .find({ user: user_id, notebook: notebook_id })
          .toArray()
          .then(
            (res) => {
              if (res === null) {
                reject(`Could not retrieve notes!`);
              } else {
                resolve({ notes: res });
              }
            },
            (err) => {
              if (err) {
                reject(err);
              }
            },
          );
      } catch (error) {
        reject(error);
      }
    });
  };

  try {
    const result = (await findNotes(userID, notebookID)) as Notes | null;
    if (result && result.notes) {
      // Convert the ObjectId's to string so that they can be parsed by props
      result.notes = result.notes.map((item) => {
        let createddate = "No date";
        let updateddate = "No date";
        if (item.createdAt) {
          createddate = item.createdAt?.toString();
        }
        if (item.updatedAt) {
          updateddate = item.updatedAt?.toString();
        }
        return {
          _id: item._id.toString(),
          notebook: item.notebook.toString(),
          note: item.note,
          createdAt: createddate,
          updatedAt: updateddate,
        };
      });
    }
    return { message: "success", result: result };
  } catch (error) {
    return {
      error: `Could not load the notes!
    ${error}`,
    };
  }
};

// getNotebooks

export const getNotebooks = async (user_ID: ObjectId) => {
  if (!user_ID || user_ID === undefined) {
    throw new Error(`User not authenticated!`);
  }

  const userID = new ObjectId(user_ID);

  let db: Db;
  try {
    db = await getDb();
  } catch (error: any) {
    throw new Error(`Could not connect to the database!
    ${error}`);
  }

  const findNotebooks = (userID: ObjectId) => {
    return new Promise((resolve, reject) => {
      try {
        db.collection("notebooks")
          .findOne({ user: userID })
          .then(
            (res) => {
              if (res === null) {
                reject(`Could not retrieve notebook!`);
              } else {
                resolve(res);
              }
            },
            (err) => {
              if (err) {
                reject(err);
              }
            },
          );
      } catch (error) {
        reject(error);
      }
    });
  };

  try {
    const result = (await findNotebooks(userID)) as Notebooks | null;
    if (result && result.notebooks) {
      const countRows = await db
        .collection("notes")
        .aggregate<{ _id: ObjectId; count: number }>([
          { $match: { user: userID } },
          { $group: { _id: "$notebook", count: { $sum: 1 } } },
        ])
        .toArray();
      const noteCountByNotebookId = new Map<string, number>();
      for (const row of countRows) {
        if (row._id) noteCountByNotebookId.set(row._id.toString(), row.count);
      }

      // Convert the ObjectId's to string so that they can be parsed by props
      result._id = result._id.toString();
      result.user = result.user.toString();
      result.notebooks = result.notebooks.map((item) => {
        const idStr = item._id.toString();
        let createddate = "No date";
        let updateddate = "No date";
        if (item.createdAt) {
          createddate = item.createdAt?.toString();
        }
        if (item.updatedAt) {
          updateddate = item.updatedAt?.toString();
        }
        return {
          _id: idStr,
          notebook_name: item.notebook_name,
          notebook_cover: item.notebook_cover,
          createdAt: createddate,
          updatedAt: updateddate,
          noteCount: noteCountByNotebookId.get(idStr) ?? 0,
        };
      });
    }
    return { message: "success", result: result };
  } catch (error) {
    return {
      error: `Could not load the notebooks!
    ${error}`,
    };
  }
};

// getNotebook

export const getNotebook = async (
  user_ID: ObjectId,
  notebook_ID: string | string[],
) => {
  if (!user_ID || user_ID === undefined) {
    throw new Error(`User not authenticated!`);
  }
  if (!notebook_ID || notebook_ID === undefined) {
    throw new Error(`Notebook ID missing!`);
  }

  let nbID = notebook_ID.toString();

  const userID = new ObjectId(user_ID);
  const notebookID = new ObjectId(nbID);

  let db: Db;
  try {
    db = await getDb();
  } catch (error: any) {
    throw new Error(`Could not connect to the database!
    ${error}`);
  }

  const findNotebook = (userID: ObjectId, notebookID: string | any) => {
    return new Promise(async (resolve, reject) => {
      try {
        db.collection("notebooks")
          .aggregate([
            {
              $match: {
                user: userID,
              },
            },
            {
              $unwind: "$notebooks",
            },
            {
              $match: {
                "notebooks._id": notebookID,
              },
            },
            {
              $replaceRoot: {
                newRoot: "$notebooks",
              },
            },
          ])
          .next()
          .then(
            (res) => {
              if (res === null) {
                reject(`Could not retrieve notebook!`);
              } else {
                resolve(res);
              }
            },
            (err) => {
              if (err) {
                reject(err);
              }
            },
          );
      } catch (error) {
        reject(error);
      }
    });
  };

  try {
    const result = (await findNotebook(userID, notebookID)) as Notebook | null;
    if (result) {
      // Convert the ObjectId's to string so that they can be parsed by props
      result._id = result._id.toString();
      let createddate = "No date";
      let updateddate = "No date";
      if (result.createdAt) {
        createddate = result.createdAt?.toString();
      }
      if (result.updatedAt) {
        updateddate = result.updatedAt?.toString();
      }
      result.createdAt = createddate;
      result.updatedAt = updateddate;
    }
    return { message: "success", result: result };
  } catch (error) {
    return {
      error: `Could not load the notebook!
    ${error}`,
    };
  }
};
