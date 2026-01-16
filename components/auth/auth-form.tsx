import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";
import { ErrorMessage } from "../../types";
import classes from "./auth-form.module.css";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import { createUser } from "../../lib/fetch-helpers";

const ErrorAlert = dynamic(() => import("../ui/error-alert"), {});
const Button = dynamic(() => import("../ui/button"), {});

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<ErrorMessage>({
    error: false,
    message: "",
  });
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  const switchAuthModeHandler = () => {
    setError({ error: false, message: "" });
    setIsLogin((prevState) => !prevState);
  };

  const validateForm = (validate: string[]) => {
    if (validate.includes("username")) {
      const enteredUsername = usernameInputRef.current!.value;
      if (enteredUsername.length < 2) {
        usernameInputRef.current?.focus();
        setError({
          error: true,
          message: APPLICATION_CONSTANTS.SIGNUP_INVALID_USERNAME,
        });
        return false;
      }
    }
    if (validate.includes("email")) {
      const enteredEmail = emailInputRef.current!.value;
      if (
        !enteredEmail ||
        !enteredEmail.includes("@") ||
        !enteredEmail.includes(".")
      ) {
        emailInputRef.current?.focus();
        setError({
          error: true,
          message: APPLICATION_CONSTANTS.SIGNUP_INVALID_EMAIL,
        });
        return false;
      }
    }
    if (validate.includes("password")) {
      const enteredPassword = passwordInputRef.current!.value;
      if (!enteredPassword || enteredPassword.trim().length < 7) {
        passwordInputRef.current?.focus();
        setError({
          error: true,
          message: APPLICATION_CONSTANTS.SIGNUP_INVALID_PASSWORD,
        });
        return false;
      }
    }
    return true;
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();

    const enteredEmail = emailInputRef.current!.value;
    const enteredPassword = passwordInputRef.current!.value;

    if (isLogin) {
      // Existing user
      const validForm = validateForm(["email", "password"]);
      if (!validForm) {
        return;
      }
      try {
        const result = await signIn("credentials", {
          redirect: false,
          email: enteredEmail,
          password: enteredPassword,
        });
        if (!result?.error) {
          // change Route to the notebooks folder.
          router.replace("/notebooks");
        } else {
          setError({ error: true, message: result.error });
        }
      } catch (error: any) {
        setError({ error: true, message: error.message });
      }
    } else {
      // New User
      let welcome_note;
      const enteredUsername = usernameInputRef.current!.value;
      const validForm = validateForm(["username", "email", "password"]);
      if (!validForm) {
        return;
      }
      try {
        const result = await createUser(
          enteredEmail,
          enteredPassword,
          enteredUsername
        );
        if (result.error) {
          throw new Error(result.error);
        }
        welcome_note = result.data;
      } catch (error: any) {
        setError({ error: true, message: error.message });
        return;
      }

      try {
        // isLogin mode - want to log the user in.
        const signin = await signIn("credentials", {
          redirect: false,
          email: enteredEmail,
          password: enteredPassword,
        });
        if (!signin?.error) {
          // change Route to the newly created welcome note in the newly created folder.
          router.replace(
            `/notebook/${welcome_note.notebookID}/${welcome_note.noteID}`
          );
        } else {
          setError({ error: true, message: signin.error });
          return;
        }
      } catch (error: any) {
        setError({ error: true, message: error.message });
        return;
      }
    }
  };

  return (
    <section className={classes.auth}>
      <Card>
        <CardContent>
          <CardHeader title={isLogin ? "Login" : "Sign Up"}></CardHeader>
          <form onSubmit={submitHandler}>
            {!isLogin && (
              <div className={classes.control}>
                <label htmlFor="username">Your Name</label>
                <input
                  type="text"
                  id="username"
                  required
                  autoComplete="name"
                  ref={usernameInputRef}
                />
              </div>
            )}
            <div className={classes.control}>
              <label htmlFor="email">Your Email</label>
              <input
                type="email"
                id="email"
                autoComplete="email"
                required
                ref={emailInputRef}
              />
            </div>
            <div className={classes.control}>
              <label htmlFor="password">Your Password</label>
              <input
                type="password"
                id="password"
                required
                autoComplete="password"
                ref={passwordInputRef}
              />
            </div>
            <div className={classes.actions}>
              <Button
                variant="contained"
                color="secondary"
                onClick={submitHandler}
                size="medium"
              >
                {isLogin ? "Login" : "Create Account"}
              </Button>
              <Button
                variant="text"
                color="secondary"
                size="large"
                onClick={switchAuthModeHandler}
              >
                {isLogin ? "Create new account" : "Login with existing account"}
              </Button>
            </div>
          </form>
          {error.error && <ErrorAlert>{error.message}</ErrorAlert>}
        </CardContent>
      </Card>
    </section>
  );
};

export default AuthForm;
