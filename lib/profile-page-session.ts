import type { Session } from "next-auth";

/**
 * Props passed to the profile page must be JSON-serializable. NextAuth's session
 * includes MongoDB ObjectId on user._id, which does not round-trip through
 * JSON.stringify (used for __NEXT_DATA__) — the client can receive {} or a
 * broken user object, so sessionHasUser() never passes and the UI spins forever.
 */
export type ProfilePageSession = {
  expires: string;
  user: {
    _id: string;
    email: string;
    username: string;
  };
};

export function sessionToProfilePageProps(session: Session): ProfilePageSession {
  const u = session.user as
    | { _id?: unknown; email?: unknown; username?: unknown }
    | undefined;
  if (!u) {
    return {
      expires: session.expires ?? "",
      user: { _id: "", email: "", username: "" },
    };
  }
  return {
    expires: session.expires ?? "",
    user: {
      _id: String(u._id ?? ""),
      email: String(u.email ?? ""),
      username: String(u.username ?? ""),
    },
  };
}
