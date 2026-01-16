import { Fragment, useEffect } from "react";
import dynamic from "next/dynamic";
import { GetServerSideProps, NextPage } from "next";
import { getSession } from "next-auth/react";
import { ObjectId } from "mongodb";
import { getNotebooks } from "../lib/db-helpers";
import { UserNotebooks, NotebooksDB } from "../types";
import { uiActions } from "../store/ui-slice";
import { useAppDispatch } from "../store/hooks";

const NotebooksList = dynamic(
  () => import("../components/notebooks/notebooks-list")
);

const NotebooksPage: NextPage<NotebooksDB> = (props) => {
  const dispatch = useAppDispatch();
  const notebooks_found = props.notebooks.result?.notebooks;

  useEffect(() => {
    if (notebooks_found) {
      // Set an old date for those notes without any updatedAt
      notebooks_found.map((x) => {
        if (x.updatedAt === "No date" || undefined) {
          x.updatedAt = "December 17, 1995 03:24:00";
        }
      });
      // Sort the notebooks by updatedAt
      notebooks_found
        .sort((a, b) => {
          if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
            return new Date(a.updatedAt) > new Date(b.updatedAt) ? 1 : -1;
          } else {
            return a.updatedAt !== undefined ? 1 : -1;
          }
        })
        .reverse();
    }
  }, [notebooks_found]);

  if (props.notebooks.error) {
    dispatch(
      uiActions.showNotification({
        status: "error",
        title: "Error! notebooks",
        message: props.notebooks.error,
      })
    );
  }

  return (
    <Fragment>
      <div className="page_scrollable_header_breadcrumb_footer_list">
        <NotebooksList notebooks={props.notebooks} />
      </div>
    </Fragment>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });
  if (!session || !session.user || !session.user._id) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  const userId = new ObjectId(session.user._id);

  let notebooksRequest: UserNotebooks;
  try {
    notebooksRequest = await getNotebooks(userId);
  } catch (error: any) {
    const errorFound: UserNotebooks = {
      error: error.message,
      message: "Error",
      result: null,
    };
    return {
      props: { notebooks: errorFound },
    };
  }
  return {
    props: { notebooks: notebooksRequest },
  };
};

export default NotebooksPage;
