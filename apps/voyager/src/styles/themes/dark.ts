import { ThemeInterface } from "@interfaces";

const theme: ThemeInterface = {
  name: "dark",
  borderRadius: 30,
  isDark: true,
  statusBarStyle: "light",
  colors: {
    background: "#000",
    onBackground: "#fff",
    secondary: "#002687",
    secondaryVariant: "#0C0057",
    onSecondary: "#fff",
    primary: "#0048B4",
    primaryVariant: "#002687",
    onPrimary: "#fff",
    surface: "#fff",
    onSurface: "#000",
    error: "#A61400",
    onError: "#fff",
    warn: "#BFAF1D",
    onWarn: "#000",
  },
};

export default theme;
