import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "../../../lib/auth";
import { connectToDatabase } from "../../../lib/db";
import { User } from "../../../types";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    // expires: any;
    // session: {
    user: User;
    // };
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
  callbacks: {
    async session({ session, user, token }) {
      let client;
      let db;
      try {
        const dbConnection = await connectToDatabase();
        client = dbConnection.client;
        db = dbConnection.db;
      } catch (error: any) {
        throw new Error(`Could not connect to the database!
        ${error}`);
      }

      const usersCollection = db.collection("users");

      const userData = await usersCollection.findOne({
        email: session.user?.email,
      });

      const newUser = {
        _id: userData!._id,
        username: userData?.username,
        email: userData?.email,
      };

      session.user = newUser;
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "jsmith@google.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        // const user = { id: 1, name: "J Smith", email: "jsmith@example.com" };
        let client;
        let db;
        try {
          const dbConnection = await connectToDatabase();
          client = dbConnection.client;
          db = dbConnection.db;
        } catch (error: any) {
          throw new Error(`Could not connect to the database!
          ${error}`);
        }

        const usersCollection = db.collection("users");

        const user: any = await usersCollection.findOne({
          email: credentials!.email,
        });

        if (!user) {
          client.close();
          throw new Error(`Email not found!
          Please re-enter your email or sign up.`);
        }

        const isValid = await verifyPassword(
          credentials!.password,
          user.password
        );

        if (!isValid) {
          client.close();
          throw new Error(`Incorrect password.
          Please re-enter your password.`);
        }

        client.close();

        if (user) {
          // Any object returned will be saved in `user` property of the JWT
          user.id = user._id;
          return user;
        } else {
          // return null; // Add this line to satisfy the `authorize` typings
          throw new Error(`Incorrect details..
          Please check your email and password.`);
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      },
    }),
  ],
};

export default NextAuth(authOptions);
