import classes from "./skeleton-block.module.css";

export function SkeletonBlock({
  height,
  className,
}: {
  height: number;
  className?: string;
}) {
  return (
    <div
      className={[classes.block, className].filter(Boolean).join(" ")}
      style={{ height }}
      aria-hidden
    />
  );
}
