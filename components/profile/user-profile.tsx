import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import classes from "./user-profile.module.css";
import { Fragment, useState } from "react";
import { uiActions } from "../../store/ui-slice";
import { useAppDispatch } from "../../store/hooks";

const ProfileForm = dynamic(() => import("./profile-form"), {});

const UserProfile = () => {
  const { data: session, status, update } = useSession();

  const dispatch = useAppDispatch();

  const [updated, setUpdated] = useState(false);

  const errorMessage = (msg: string) => {
    dispatch(
      uiActions.showNotification({
        status: "error",
        title: "Error!",
        message: msg,
      })
    );
  };

  const changePasswordHandler = async (passwordData: {}) => {
    try {
      const response = await fetch("/api/auth/user/change-password", {
        method: "PATCH",
        body: JSON.stringify(passwordData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      errorMessage(error.message || `An error occured updating the Password!`);
      return;
    }
    // Update the session
    update();
    setUpdated(true);
  };

  const changeUsernameHandler = async (usernameData: {}) => {
    try {
      const response = await fetch("/api/auth/user/change-username", {
        method: "PATCH",
        body: JSON.stringify(usernameData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      errorMessage(error.message || `An error occured updating the User Name!`);
      return;
    }
    // Update the session
    update();
    setUpdated(true);
  };

  const profileUpdated = () => {
    setUpdated((prev) => {
      return false;
    });
    return updated;
  };

  return (
    <Fragment>
      {session && (
        <section className={classes.profile}>
          <h2>{session?.user.username}</h2>
          <h3>{session?.user.email}</h3>
          <ProfileForm
            username={session?.user.username}
            onChangePassword={changePasswordHandler}
            onChangeUsername={changeUsernameHandler}
            updated={profileUpdated}
          />
        </section>
      )}
    </Fragment>
  );
};

export default UserProfile;
