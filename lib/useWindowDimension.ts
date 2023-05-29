/**
 * // useWindowDimension.ts
 * * This hook returns the viewport/window height and width
 */

import { useEffect, useState } from "react";
import APPLICATION_CONSTANTS from "./../application_constants/applicationConstants";

type WindowDimentions = {
  width: number;
  height: number;
  viewnote_width: number | null | undefined;
};

const useWindowDimensions = (): WindowDimentions => {
  const [windowDimensions, setWindowDimensions] = useState<WindowDimentions>({
    width: 0,
    height: 0,
    viewnote_width: 0,
  });

  useEffect(() => {
    function handleResize(): void {
      let vnw: number;
      if (document && document.querySelector("#viewnote_id")) {
        vnw = document.querySelector("#viewnote_id")!.clientWidth;
      }

      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        viewnote_width:
          document.querySelector("#viewnote_id") &&
          document.querySelector("#viewnote_id")!.clientWidth <
            window.innerWidth
            ? document.querySelector("#viewnote_id")!.clientWidth
            : document.querySelector("#viewnote_id")
            ? window.innerWidth - APPLICATION_CONSTANTS.VIEWNOTE_PADDING_MOBILE
            : window.innerWidth - APPLICATION_CONSTANTS.VIEWNOTE_PADDING,
      });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return (): void => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowDimensions;
};

export default useWindowDimensions;
