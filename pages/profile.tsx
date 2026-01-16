import { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";
import { getSession } from "next-auth/react";
import { Fragment } from "react";

const UserProfile = dynamic(() => import("../components/profile/user-profile"));

const ProfilePage: NextPage = () => {
  return (
    <Fragment>
      <UserProfile />
    </Fragment>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });

  if (!session) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
};

export default ProfilePage;
