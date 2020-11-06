import React, { FC, useEffect, useRef, useState } from "react";
import {
  StyleProp,
  View,
  Text as RNText,
  TextStyle,
  TextProps,
  TextInput,
  TextInputProps,
  Pressable,
  PressableProps,
  Image,
  ImageProps,
  Animated,
} from "react-native";
import { observer } from "mobx-react-lite";
import { ColorsThemeProperties, PrimaryThemeColorsProperties } from "@/types";
import UIStore from "@/states/ui.store";
import { TextInputMask, TextInputMaskProps } from "react-native-masked-text";
import { Easing } from "react-native";

const easing = Easing.bezier(0.88, 0.02, 0.16, 1.02);

export const Input = observer<
  Omit<TextInputMaskProps, "style" | "type" | "inputRef" | "ref"> & {
    getRef?: (ref: any) => void;
    status?:
      | keyof Pick<
          PrimaryThemeColorsProperties,
          "success" | "info" | "warn" | "error"
        >
      | "normal";
    type?: TextInputMaskProps["type"];
  }
>(({ status = "normal", getRef, type, placeholder, value, ...props }) => {
  const statusColor = status === "normal" ? "onBackground" : status;
  const [focused, setFocus] = useState(false);
  const placeholderY = useRef(new Animated.Value(-10)).current;
  const placeholderX = useRef(new Animated.Value(0)).current;
  const lineColor = UIStore.theme.colors[statusColor];
  const setPlaceholderPos = (Y: number, X: number) => {
    Animated.timing(placeholderY, {
      toValue: Y,
      duration: 300,
      useNativeDriver: true,
      easing,
    }).start();
    Animated.timing(placeholderX, {
      toValue: X,
      duration: 300,
      useNativeDriver: true,
      easing,
    }).start();
  };

  useEffect(() => {
    if (value && value.length > 0) {
      setFocus(true);
    }
  }, [value]);

  useEffect(() => {
    if (focused) setPlaceholderPos(-34, -10);
    else setPlaceholderPos(-10, 0);
  }, [focused]);

  const onFocusHandler = () => {
    setFocus(true);
  };
  const onBlurHandler = () => {
    if (!value) setFocus(false);
  };
  const inputStyle = {
    color: UIStore.theme.colors.onBackground,
    height: 40,
    paddingHorizontal: 10,
  };

  return (
    <View
      style={{
        height: 40,
        marginVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: lineColor,
      }}
    >
      <Animated.Text
        style={{
          color: UIStore.theme.colors.onBackground,
          borderRadius: 2,
          position: "absolute",
          top: "50%",
          left: 10,
          transform: [
            { translateY: placeholderY },
            { translateX: placeholderX },
          ],
        }}
      >
        {placeholder}
      </Animated.Text>
      {type ? (
        <TextInputMask
          refInput={(ref) => {
            getRef && getRef(ref);
          }}
          type={type}
          onFocus={onFocusHandler}
          onBlur={onBlurHandler}
          value={value}
          style={inputStyle}
          includeRawValueInChangeText={true}
          {...props}
        />
      ) : (
        <TextInput
          ref={(ref) => {
            getRef && getRef(ref);
          }}
          onFocus={onFocusHandler}
          onBlur={onBlurHandler}
          value={value}
          style={inputStyle}
          {...props}
        />
      )}
    </View>
  );
});

export const Button = observer<
  {
    type: ColorsThemeProperties;
    textStyle?: StyleProp<TextStyle>;
  } & Partial<PressableProps>
>(({ children, textStyle, type, style, disabled, ...props }) => {
  const UpperFirstLetter = type.charAt(0).toUpperCase() + type.slice(1);

  const fontColorProp = `on${UpperFirstLetter}` as ColorsThemeProperties;
  const variantColor =
    (UIStore.theme.colors as any)[`${type}Variant`] ||
    UIStore.theme.colors[type];

  return (
    <Pressable
      disabled={disabled}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: UIStore.theme.borderRadius,
        backgroundColor: UIStore.theme.colors[type],
        opacity: disabled ? 0.6 : 1,
        marginVertical: 6,
        ...((style as object) || {}),
      }}
      {...props}
    >
      <RNText
        style={[
          {
            width: "100%",
            color: UIStore.theme.colors[fontColorProp],
            textAlign: "center",
            textAlignVertical: "center",
          },
          textStyle,
        ]}
      >
        {children}
      </RNText>
    </Pressable>
  );
});

export const Text = observer<TextProps & { color?: ColorsThemeProperties }>(
  ({ style, color, ...props }) => {
    const finalStyle = Array.isArray(style)
      ? [
          ...style,
          {
            color: UIStore.theme.colors[color || "onBackground"],
            fontFamily: "Roboto",
          },
        ]
      : {
          color: UIStore.theme.colors[color || "onBackground"],
          fontFamily: "Roboto",
          ...((style as object) || {}),
        };

    return <RNText style={finalStyle} {...props} />;
  },
);

export const Divider = observer(() => {
  return (
    <View
      style={{
        width: "80%",
        height: 0.5,
        marginVertical: 12,
        opacity: 0.4,
        backgroundColor: UIStore.theme.colors.onBackground,
      }}
    />
  );
});

export const Avatar: FC<
  { size: number; uri: string } & Partial<ImageProps>
> = ({ size, uri, style, source, ...props }) => {
  return (
    <Image
      style={[
        {
          borderRadius: size,
          width: size,
          height: size,
          resizeMode: "cover",
        },
        style,
      ]}
      source={{ uri }}
      {...props}
    />
  );
};
