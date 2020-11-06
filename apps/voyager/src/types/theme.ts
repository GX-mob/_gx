export type PrimaryThemeColorsProperties = Pick<
  ThemeInterface["colors"],
  | "background"
  | "surface"
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warn"
  | "error"
>;
export type ColorsThemeProperties = keyof ThemeInterface["colors"];

export type ThemeInterface = {
  name: string;
  borderRadius: number;
  isDark: boolean;
  statusBarStyle: "light" | "dark";
  mapStyle: any;
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
    success: string;
    onSuccess: string;
    info: string;
    onInfo: string;
    warn: string;
    onWarn: string;
    error: string;
    onError: string;
  };
};
