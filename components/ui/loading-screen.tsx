import classes from "./loading-screen.module.css";

export function LoadingSpinner({
  compact,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        classes.spinner,
        compact ? classes.spinnerCompact : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    />
  );
}

const LoadingScreen = () => {
  return (
    <div className={classes.loading_outer}>
      <div className={classes.loading_inner}>
        <LoadingSpinner />
      </div>
    </div>
  );
};

export default LoadingScreen;
