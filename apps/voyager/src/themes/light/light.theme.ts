import { ThemeInterface } from "@/types";
import mapStyle from "./light-theme.map.style.json";

const theme: ThemeInterface = {
  name: "light",
  borderRadius: 30,
  isDark: false,
  statusBarStyle: "dark",
  mapStyle,
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
    success: "lime",
    onSuccess: "#fff",
    error: "red",
    onError: "#000",
    warn: "#BFAF1D",
    onWarn: "#000",
  },
};

export default theme;
