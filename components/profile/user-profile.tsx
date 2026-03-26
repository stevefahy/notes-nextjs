import { useMemo } from "react";
import classes from "./user-profile.module.css";
import ProfileForm from "./profile-form";
import { LoadingSpinner } from "../ui/loading-screen";
import { useSession } from "next-auth/react";
import type { ProfilePageSession } from "../../lib/profile-page-session";

type Props = {
  /** JSON-safe session from getServerSideProps (see lib/profile-page-session.ts). */
  session?: ProfilePageSession;
};

const UserProfile = ({ session: serverSession }: Props) => {
  const { data: clientSession, update } = useSession();

  const details = useMemo(() => {
    const cu = clientSession?.user as
      | { email?: unknown; username?: unknown; _id?: unknown }
      | undefined;
    if (cu && typeof cu.email === "string") {
      return {
        username: String(cu.username ?? ""),
        email: cu.email,
        _id: String(cu._id ?? ""),
      };
    }
    const su = serverSession?.user;
    if (su && (su._id || su.email)) {
      return {
        username: su.username,
        email: su.email,
        _id: su._id,
      };
    }
    return null;
  }, [clientSession, serverSession]);

  const success = details != null;

  const initial = details?.username?.charAt(0).toUpperCase() ?? "";
  const avatarLabel = details?.username
    ? `Avatar, ${details.username}`
    : "User profile";

  const userId = details?._id ?? "";
  const userEmail = details?.email ?? "";

  return (
    <section className={classes.profilePage}>
      {!success && (
        <div className={classes.loadingWrap} role="status" aria-label="Loading">
          <LoadingSpinner />
        </div>
      )}
      {success && details ? (
        <>
          <div className={classes.profileOuter} aria-label={avatarLabel}>
            {initial}
          </div>
          <div className={classes.profileName}>
            {details.username ? <div>{details.username}</div> : null}
          </div>
          <div className={classes.profileEmail}>
            {details.email ? details.email : null}
          </div>
          <ProfileForm
            userName={details.username}
            userEmail={userEmail}
            userId={userId}
            onSessionRefresh={() => {
              void update();
            }}
          />
        </>
      ) : null}
    </section>
  );
};

export default UserProfile;
