import classes from "./loading-screen.module.css";

const LoadingScreen = () => {
  return (
    <div className={classes.loading_outer}>
      <div className={classes.loading_inner}>
        <p>Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
