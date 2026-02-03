import type { GetServerSideProps, NextPage } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Notes NextJS</title>
        <meta name="description" content="Notes app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main></main>
    </div>
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
    redirect: {
      destination: "/notebooks",
      permanent: false,
    },
  };
};

export default Home;
