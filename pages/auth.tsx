import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { NextPage } from "next";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";

const AuthForm = dynamic(() => import("../components/auth/auth-form"), {});

const AuthPage: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.replace("/notebooks");
      } else {
        setIsLoading(false);
      }
    });
  }, [router]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return <AuthForm />;
};

export default AuthPage;
