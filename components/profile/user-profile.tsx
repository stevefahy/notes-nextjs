import classes from "./user-profile.module.css";
import ProfileForm from "./profile-form";
import { LoadingSpinner } from "../ui/loading-screen";
import { useSession } from "next-auth/react";

const UserProfile = () => {
  const { data: session, status, update } = useSession();

  const success = status === "authenticated";
  const token = session?.user != null;
  const details =
    session?.user != null
      ? {
          username: session.user.username,
          email: session.user.email,
          _id: String(session.user._id),
        }
      : null;

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
      {success && !token && (
        <p className={classes.unauthorized}>Unauthorized</p>
      )}
      {success && token && details && (
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
      )}
    </section>
  );
};

export default UserProfile;
