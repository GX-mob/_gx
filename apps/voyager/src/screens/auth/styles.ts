import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: "80%",
    height: "100%",
    marginHorizontal: "10%",
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
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "100",
  },
});
