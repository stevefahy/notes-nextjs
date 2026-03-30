import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ObjectId } from "mongodb";
import { verifyPassword } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { User } from "../../../types";

declare module "next-auth" {
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    email?: string | null;
    username?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user && "_id" in user && "username" in user) {
        const u = user as unknown as {
          _id: ObjectId;
          email: string;
          username: string;
        };
        token.sub = u._id.toString();
        token.email = u.email;
        token.username = u.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && token.email) {
        session.user = {
          _id: new ObjectId(token.sub),
          email: token.email as string,
          username: (token.username as string) ?? "",
        };
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "jsmith@google.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        let db;
        try {
          db = await getDb();
        } catch (error: unknown) {
          throw new Error(
            `Could not connect to the database!
          ${error}`,
          );
        }

        const usersCollection = db.collection("users");

        const user = (await usersCollection.findOne({
          email: credentials!.email,
        })) as {
          _id: ObjectId;
          email: string;
          username: string;
          password: string;
        } | null;

        if (!user) {
          throw new Error(`Email not found!
          Please re-enter your email or sign up.`);
        }

        const isValid = await verifyPassword(
          credentials!.password,
          user.password,
        );

        if (!isValid) {
          throw new Error(`Incorrect password.
          Please re-enter your password.`);
        }

        return {
          id: user._id.toString(),
          _id: user._id,
          email: user.email,
          username: user.username,
        };
      },
    }),
  ],
};

export default NextAuth(authOptions);
