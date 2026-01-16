import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow:
            "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)",
          color: "rgb(98, 98, 98);",
        },
      },
    },

    MuiFab: {
      variants: [
        {
          props: { size: "xsmall" },
          style: {
            width: "30px",
            height: "30px",
            minHeight: "30px",
          },
        },
      ],
    },

    MuiButton: {
      variants: [
        {
          props: { size: "large" },
          style: ({ theme }) => ({
            fontSize: "1.1rem",
          }),
        },
        {
          props: { size: "medium" },
          style: ({ theme }) => ({
            fontSize: ".95rem",
          }),
        },
        {
          props: { size: "small" },
          style: ({ theme }) => ({
            fontSize: ".85rem",
          }),
        },
      ],
    },
  },
  typography: {
    button: {
      textTransform: "none",
    },
  },
  palette: {
    primary: {
      main: "#4D0000",
    },
    secondary: {
      main: "#B30000",
    },
    special: {
      main: "#eaef96",
      contrastText: "#fff",
    },
    success: {
      main: "#ecf7ed",
    },
  },
});

declare module "@mui/material/styles" {
  interface Palette {
    special: Palette["primary"];
  }
  // allow configuration using `createTheme`
  interface PaletteOptions {
    special?: PaletteOptions["primary"];
  }
}
// Update the Button's color prop options
declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    special: true;
  }
}
// Update the SvgIcon's color prop options
declare module "@mui/material/SvgIcon" {
  interface SvgIconPropsColorOverrides {
    special: true;
  }
}

// Update the Button's color prop options
declare module "@mui/material/Fab" {
  interface FabPropsSizeOverrides {
    xsmall: true;
  }
}

export default theme;
