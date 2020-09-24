export type ColorsThemeProperties = keyof ThemeInterface["colors"];

export interface ThemeInterface {
  name: string;
  borderRadius: number;
  isDark: boolean;
  statusBarStyle: "light" | "dark";
  colors: {
    primary: string;
    primaryVariant: string;
    onPrimary: string;
    secondary: string;
    secondaryVariant: string;
    onSecondary: string;
    background: string;
    onBackground: string;
    surface: string;
    onSurface: string;
    error: string;
    onError: string;
    warn: string;
    onWarn: string;
  };
}
