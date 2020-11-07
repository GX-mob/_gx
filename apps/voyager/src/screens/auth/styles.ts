import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    paddingTop: 46,
  },
  contentContainer: {
    paddingHorizontal: "10%",
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  title: {
    alignSelf: "flex-start",
    fontSize: 36,
    marginVertical: 4,
    fontWeight: "100",
    textTransform: "uppercase",
  },
  paragraph: {
    alignSelf: "flex-start",
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "100",
  },
  subTitle: {
    alignSelf: "flex-start",
    fontSize: 28,
    marginVertical: 16,
    fontWeight: "100",
  },
});
