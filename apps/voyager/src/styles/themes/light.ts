import { ThemeInterface } from "@interfaces";

const theme: ThemeInterface = {
  name: "light",
  borderRadius: 3,
  isDark: false,
  statusBarStyle: "dark",
  colors: {
    background: "#fff",
    onBackground: "#000",
    primary: "#000",
    primaryVariant: "#eee",
    onPrimary: "#fff",
    secondary: "blue",
    secondaryVariant: "green",
    onSecondary: "#000",
    surface: "#eee",
    onSurface: "#000",
    error: "red",
    onError: "#000",
    warn: "#BFAF1D",
    onWarn: "#000",
  },
};

export default theme;
