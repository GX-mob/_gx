import React, { FC, useRef, useEffect, RefCallback } from "react";
import { View, Animated, Easing, ViewProps } from "react-native";
import { observer } from "mobx-react-lite";
import { Marker, MarkerProps, MarkerAnimated } from "react-native-maps";
import { UIStore } from "@stores";
import { Avatar } from "./atoms";

const easing = Easing.bezier(0.88, 0.02, 0.16, 1.02);

export const UserMark: FC<
  MarkerProps & { markRef?: RefCallback<any>; avatar: string; heading?: number }
> = observer(({ avatar, heading = 0, markRef, ...props }) => {
  const headingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Normalize heading direction
    heading += 40;
    Animated.timing(headingAnim, {
      toValue: heading,
      duration: 600,
      useNativeDriver: true,
      easing,
    }).start();
  }, [heading]);

  const spin = headingAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <MarkerAnimated
      ref={(ref) => {
        markRef && markRef(ref);
      }}
      {...props}
      style={{
        position: "relative",
        width: 46,
        height: 46,
        overflow: "visible",
      }}
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
          borderTopLeftRadius: 8,
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
    </MarkerAnimated>
  );
});
