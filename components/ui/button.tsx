import { NextPage } from "next";
import Link from "next/link";
import { ButtonType } from "../../types";
import { Button as MUIButton } from "@mui/material";

interface MUIButtonType extends ButtonType {}

const Button: NextPage<MUIButtonType> = (props) => {
  let default_color = props.color ? props.color : "secondary";
  let default_variant = props.variant ? props.variant : "text";
  let default_size = props.size ? props.size : "small";
  let default_type = props.type ? props.type : "button";

  if (props.link) {
    return (
      <MUIButton
        color={default_color}
        variant={default_variant}
        disabled={props.disabled}
        size={props.size}
        type={default_type}
      >
        <Link href={props.link}>{props.children}</Link>
      </MUIButton>
    );
  }
  return (
    <MUIButton
      size={props.size}
      color={default_color}
      variant={default_variant}
      disabled={props.disabled}
      onClick={props.onClick}
      type={default_type}
    >
      {props.children}
    </MUIButton>
  );
};

export default Button;
