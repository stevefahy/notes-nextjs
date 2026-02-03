import dynamic from "next/dynamic";
import { GetServerSideProps, NextPage } from "next";
import { getSession } from "next-auth/react";

const AuthForm = dynamic(() => import("../components/auth/auth-form"), {});

const AuthPage: NextPage = () => {
  return <AuthForm />;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });

  if (session) {
    return {
      redirect: {
        destination: "/notebooks",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default AuthPage;
