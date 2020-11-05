import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    paddingTop: 46,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingVertical: 12,
  },
  title: {
    alignSelf: "flex-start",
    fontSize: 36,
    marginVertical: 4,
    fontWeight: "100",
    textTransform: "uppercase",
  },
  subTitle: {
    alignSelf: "flex-start",
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "100",
  },
});
