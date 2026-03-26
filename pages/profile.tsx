import { GetServerSideProps, NextPage } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import {
  sessionToProfilePageProps,
  type ProfilePageSession,
} from "../lib/profile-page-session";
import UserProfile from "../components/profile/user-profile";
import { authOptions } from "./api/auth/[...nextauth]";

const ProfilePage: NextPage<{ session: ProfilePageSession }> = ({
  session,
}) => {
  return <UserProfile session={session} />;
};

export const getServerSideProps: GetServerSideProps<{
  session: ProfilePageSession;
}> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session: sessionToProfilePageProps(session as Session),
    },
  };
};

export default ProfilePage;
