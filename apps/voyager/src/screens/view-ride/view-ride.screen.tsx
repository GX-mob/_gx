import React, { useState, useEffect } from "react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { AnimatedSetup } from "@/components/general";
import { Text } from "@/components/atoms";
import { MapViewComponent, UserMark } from "@/components/map";
import { View, ActivityIndicator } from "react-native";
import { UIStore, CreateRideStore } from "@/stores";

export const CreateRideScreen = observer(() => {
  useEffect(() => {
    CreateRideStore.watchPosition();
  });

  return (
    <AnimatedSetup
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {!CreateRideStore.center ? (
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
            size="small"
            style={{ margin: 8 }}
            color={UIStore.theme.colors.onBackground}
          />
          <Text>Aguardando o gps...</Text>
        </View>
      ) : (
        <MapViewComponent
          style={{ width: "100%", height: "100%" }}
          center={toJS(CreateRideStore.center)}
          defaultCameraProps={{
            pitch: 45,
            zoom: 20,
            heading: 0,
            altitude: 100,
          }}
        >
          {Object.entries(toJS(CreateRideStore.positions)).map(
            ([id, { position, region }]) => {
              return (
                <UserMark
                  key={id}
                  markRef={(ref) => {
                    CreateRideStore.marksRefs[id] = ref;
                  }}
                  avatar={`https://api.adorable.io/avatars/30/foo.png`}
                  coordinate={region}
                  heading={position.heading}
                />
              );
            },
          )}
        </MapViewComponent>
      )}
    </AnimatedSetup>
  );
});
