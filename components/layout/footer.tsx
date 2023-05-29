import { Props } from "../../types";
import classes from "./footer.module.css";

const Footer = (props: Props) => {
  return (
    <div className={classes.page_footer}>
      <div className={classes.page_footer_container}>{props.children}</div>
    </div>
  );
};

export default Footer;
