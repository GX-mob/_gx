import React, { useEffect } from "react";
import { View, ActivityIndicator, Dimensions } from "react-native";
import MapView from "react-native-maps";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { UIStore, MainStore } from "@stores";
import { Button } from "@components/atoms";
import { AnimatedSetup } from "@components/general";
import { UserMark } from "@components/map";

const { width, height } = Dimensions.get("window");
const defaultCameraProps = { pitch: 45, zoom: 20, heading: 0, altitude: 100 };

export const MainScreen = observer(() => {
  useEffect(() => {
    MainStore.watchPosition();
  }, []);

  if (MainStore.loading) {
    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color={UIStore.theme.colors.onBackground}
        />
      </View>
    );
  }

  return (
    <AnimatedSetup
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <MapView
        ref={(ref) => {
          MainStore.mapRef = ref;
        }}
        style={{ width, height: height - 26, top: 26 }}
        provider="google"
        showsBuildings={false}
        loadingEnabled
        showsIndoors={false}
        showsPointsOfInterest={false}
        loadingIndicatorColor={UIStore.theme.colors.onBackground}
        loadingBackgroundColor={UIStore.theme.colors.background}
        customMapStyle={UIStore.theme.mapStyle}
        initialCamera={{
          center: { latitude: -9.572544, longitude: -35.776623 },
          ...defaultCameraProps,
        }}
        onTouchEnd={(event) => {
          console.log("disable auto repositions events");
        }}
      >
        {Object.entries(toJS(MainStore.positions)).map(
          ([id, { position, region }]) => {
            return (
              <UserMark
                key={id}
                markRef={(ref) => {
                  MainStore.marksRefs[id] = ref;
                }}
                avatar={`https://api.adorable.io/avatars/30/foo.png`}
                coordinate={region}
                heading={position.heading}
              />
            );
          },
        )}
      </MapView>
      <Button
        type="primary"
        style={{
          width: width - 40,
          position: "absolute",
          bottom: 30,
          left: "50%",
          transform: [{ translateX: -((width - 40) / 2) }],
        }}
        onPress={() => {
          MainStore.setMapPosition({
            latitude: -9.571870868739015,
            longitude: -35.77662969008088,
          });
        }}
      >
        Change
      </Button>
    </AnimatedSetup>
  );
});
