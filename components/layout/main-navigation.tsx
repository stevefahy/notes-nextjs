import { Fragment, useLayoutEffect } from "react";
import Image from "next/image";
import classes from "./main-navigation.module.css";
import MenuDropdown from "../ui/menu-dropdown";
import Breadcrumb from "./breadcrumb";
import { useAppSelector } from "../../store/hooks";
import { setScreenHeight } from "../../lib/setScreenHeight";

const MainNavigation = () => {
  const editNotes = useAppSelector((state) => state.editNotes);

  useLayoutEffect(() => {
    setScreenHeight();
  }, [editNotes.active, editNotes.selectedCount]);

  return (
    <Fragment>
      <div className={classes.header} id="header_height">
        <div className={classes.header_container}>
          <div className={classes.logo_row}>
            <div className={classes.logo_mark}>
              <Image
                src="/assets/images/edit_white.png"
                alt="logo"
                width={18}
                height={18}
              />
            </div>
            <span className={classes.logo_text}>Notes</span>
          </div>
          <div className={classes.header_toolbar}>
            {editNotes.active && editNotes.selectedCount > 0 ? (
              <span className={classes.editNotesPill} aria-live="polite">
                {editNotes.selectedCount} selected
              </span>
            ) : null}
            <MenuDropdown />
          </div>
        </div>
      </div>
      <Breadcrumb />
    </Fragment>
  );
};

export default MainNavigation;
