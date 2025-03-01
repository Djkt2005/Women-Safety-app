import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00a0fc",
      light: "#4dabf5",
      dark: "#1769aa",
    },
    secondary: {
      main: "#f50057",
      light: "#f73378",
      dark: "#ab003c",
    },
    background: {
      default: "#0a0a0a",
      paper: "#1a1a1a",
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(255, 255, 255, 0.7)",
    },
    divider: "rgba(255, 255, 255, 0.12)",
    error: {
      main: "#f44336",
    },
    warning: {
      main: "#ff9800",
    },
    success: {
      main: "#4caf50",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          backgroundImage: "none",
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          borderRadius: 12,
          boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
          backgroundImage: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1a1a",
          backgroundImage: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.23)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255, 255, 255, 0.4)",
            },
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
});

export default theme;
