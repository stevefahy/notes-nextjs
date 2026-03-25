import { Fragment, useMemo } from "react";
import dynamic from "next/dynamic";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import { ObjectId } from "mongodb";
import { getNotebooks } from "../lib/db-helpers";
import { runClientNavIfOnline } from "../lib/clientOfflineNav";
import { useAppDispatch } from "../store/hooks";
import { UserNotebooks, NotebooksDB } from "../types";

const NotebooksList = dynamic(
  () => import("../components/notebooks/notebooks-list"),
);

const NotebooksPage: NextPage<NotebooksDB> = (props) => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const onNotebooksReload = useMemo(
    () => () => {
      runClientNavIfOnline(dispatch, () => void router.replace(router.asPath));
    },
    [dispatch, router],
  );

  return (
    <Fragment>
      <div className="page_scrollable_header_breadcrumb_footer_list">
        <NotebooksList
          notebooks={props.notebooks}
          onNotebooksReload={onNotebooksReload}
        />
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
