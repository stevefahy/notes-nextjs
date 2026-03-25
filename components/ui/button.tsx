import { ButtonType } from "../../types";
import Link from "next/link";
import classes from "./button.module.css";

const sizeClass = {
  small: classes.sizeSmall,
  medium: classes.sizeMedium,
  large: classes.sizeLarge,
} as const;

const Button = (props: ButtonType) => {
  const size = props.size ?? "small";
  const variant = props.variant ?? "text";
  const color = props.color ?? "secondary";
  const type = props.type ?? "button";

  const sizeCls = sizeClass[size] ?? classes.sizeSmall;

  let variantCls = classes.variantText;
  if (variant === "contained") {
    variantCls =
      color === "secondary"
        ? classes.containedSecondary
        : classes.containedPrimary;
  } else if (variant === "outlined") {
    variantCls = classes.variantOutlined;
  }

  const className = [classes.root, sizeCls, variantCls].join(" ");

  if (props.link) {
    return (
      <Link className={className} href={props.link}>
        {props.children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={className}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

export default Button;
