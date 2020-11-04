import React, { FC, useRef, useEffect, RefCallback } from "react";
import { View, Animated, Easing } from "react-native";
import { observer } from "mobx-react-lite";
import {
  Marker,
  MarkerProps,
  MarkerAnimated,
  AnimatedRegion,
  Circle,
} from "react-native-maps";
import { UIStore } from "@/states";
import { Position, RoutePointLocation } from "@/types/map";
import { Avatar } from "../atoms";

const easing = Easing.bezier(0.88, 0.02, 0.16, 1.02);

export const MarkBase: FC<
  {
    position: Position;
    markRef?: RefCallback<any>;
    style?: MarkerProps["style"];
  } & Omit<MarkerProps, "coordinate">
> = ({ markRef, position, style, ...props }) => {
  const markElObject = useRef(null);
  const animatedRegion = useRef(
    new AnimatedRegion({
      latitude: position.latitude,
      longitude: position.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
  ).current;

  markRef &&
    useEffect(() => {
      markRef(markElObject.current);
    }, [markElObject.current]);

  useEffect(() => {
    // Position animation
    animatedRegion
      .timing({
        latitude: position.latitude,
        longitude: position.longitude,
        duration: 200,
        useNativeDriver: false,
      })
      .start();
  }, [position]);

  return (
    <MarkerAnimated
      {...props}
      ref={markElObject}
      coordinate={animatedRegion}
      style={style}
    />
  );
};

export const SelfMark: FC<{ position: Position; pitch: number }> = ({
  position,
  pitch,
}) => {
  const headingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Heading animatin
    const { heading } = { ...position };
    if (!heading) return;
    Animated.timing(headingAnim, {
      // Normalize heading rotation direction
      toValue: heading + 40,
      duration: 300,
      useNativeDriver: true,
      easing,
    }).start();
  }, [position.heading]);

  const spin = headingAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <>
      {position.accuracy ? (
        <Circle
          strokeColor="rgba(0, 102, 255, 0.3)"
          lineJoin="round"
          fillColor="rgba(0, 102, 255, 0.1)"
          center={position}
          radius={position.accuracy}
        />
      ) : null}
      <MarkBase
        position={position}
        style={{
          position: "relative",
          width: 30,
          height: 30,
          overflow: "visible",
        }}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 20,
            height: 20,
            transform: [
              { translateX: -10 },
              { translateY: -7.5 },
              { rotateX: `${pitch}deg` },
            ],
          }}
        >
          <Animated.View
            style={{
              width: 16,
              height: 16,

              position: "absolute",
              top: "50%",
              left: "50%",
              backgroundColor: "#fff",
              borderRadius: 16,
              borderTopLeftRadius: position.heading ? 3 : 16,
              transform: [
                { translateX: -8 },
                { translateY: -8 },
                { rotateZ: spin },
              ],
            }}
          />
        </View>
        <View
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 16,
            height: 16,
            borderRadius: 16,
            backgroundColor: "#0066ff",
            borderColor: "#ffffff",
            borderWidth: 1,
            transform: [
              { rotateX: `${pitch}deg` },
              { translateX: -8 },
              { translateY: -8 },
            ],
          }}
        />
      </MarkBase>
    </>
  );
};

export const UserMark: FC<{
  position: Position;
  markRef?: RefCallback<any>;
  avatar: string;
}> = observer(({ avatar, position, markRef, ...props }) => {
  const headingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Heading animatin
    const { heading } = { ...position };
    if (!heading) return;
    Animated.timing(headingAnim, {
      // Normalize heading rotation direction
      toValue: heading + 40,
      duration: 300,
      useNativeDriver: true,
      easing,
    }).start();
  }, [position.heading]);

  const spin = headingAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <MarkBase
      markRef={markRef}
      position={position}
      style={{
        position: "relative",
        width: 46,
        height: 46,
        overflow: "visible",
      }}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 34,
          height: 34,
          backgroundColor: UIStore.theme.colors.primary,
          borderRadius: 34,
          borderTopLeftRadius: position.heading ? 8 : 34,
          transform: [
            { translateX: -17 },
            { translateY: -17 },
            { rotate: spin },
          ],
        }}
      />
      <Avatar
        uri={avatar}
        size={30}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: [{ translateX: -15 }, { translateY: -15 }],
        }}
      />
    </MarkBase>
  );
});

const RoutePointMarkPointBase: FC<{ location: RoutePointLocation }> = ({
  location,
}) => {
  return (
    <View
      style={{
        width: 14,
        height: 14,
        borderRadius: location === "start" ? 14 : 0,
        backgroundColor: "#0066ff",
        borderWidth: 4,
        borderColor: "#fff",
      }}
    />
  );
};

export const RoutePointMark: FC<{
  position: Omit<Position, "heading" | "accuracy">;
  location: RoutePointLocation;
}> = ({ position, location }) => (
  <Marker coordinate={position} anchor={{ x: 0.5, y: 0.5 }}>
    <RoutePointMarkPointBase location={location} />
  </Marker>
);
