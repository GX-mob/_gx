import { ThemeInterface } from "@interfaces";

const theme: ThemeInterface = {
  name: "light",
  borderRadius: 30,
  isDark: false,
  statusBarStyle: "dark",
  colors: {
    background: "#fff",
    onBackground: "#000",
    secondary: "#000",
    secondaryVariant: "#fff",
    onSecondary: "#fff",
    primary: "#0048B4",
    primaryVariant: "#002687",
    onPrimary: "#fff",
    surface: "#000",
    onSurface: "#fff",
    error: "red",
    onError: "#000",
    warn: "#BFAF1D",
    onWarn: "#000",
  },
};

export default theme;
