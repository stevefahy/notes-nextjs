import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";

const AC = APPLICATION_CONSTANTS;

export function respondMethodNotAllowedPost(res: NextApiResponse): void {
  res.setHeader("Allow", "POST");
  res.status(405).json({ error: AC.GENERAL_ERROR });
}

/**
 * Parses a string from the request body as MongoDB ObjectId.
 * Sends 400 with `errorConstant` and returns null when invalid.
 */
export function parseObjectIdFromBody(
  value: unknown,
  res: NextApiResponse,
  errorConstant: string,
): ObjectId | null {
  if (typeof value !== "string" || !ObjectId.isValid(value)) {
    res.status(400).json({ error: errorConstant });
    return null;
  }
  return new ObjectId(value);
}

export async function requireSessionUserId(
  req: NextApiRequest,
  res: NextApiResponse,
  authOptions: NextAuthOptions,
): Promise<ObjectId | null> {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?._id) {
      return session.user._id;
    }
    res.status(401).json({ error: AC.UNAUTHORIZED });
    return null;
  } catch {
    res.status(500).json({ error: AC.ERROR_SERVER });
    return null;
  }
}
