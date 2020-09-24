import { ThemeInterface } from "@interfaces";

const theme: ThemeInterface = {
  name: "dark",
  borderRadius: 3,
  isDark: true,
  statusBarStyle: "light",
  colors: {
    background: "#000",
    onBackground: "#fff",
    primary: "#1900B5",
    primaryVariant: "#0C0057",
    onPrimary: "#fff",
    secondary: "#0048B4",
    secondaryVariant: "#002687",
    onSecondary: "#fff",
    surface: "#1c1c1c",
    onSurface: "#cccccc",
    error: "#A61400",
    onError: "#fff",
    warn: "#BFAF1D",
    onWarn: "#000",
  },
};

export default theme;
