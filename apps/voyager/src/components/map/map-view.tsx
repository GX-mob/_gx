import React, { FC, useRef, useEffect, RefCallback } from "react";
import { observer } from "mobx-react-lite";
import MapView, { MapViewProps } from "react-native-maps";
import { UIStore } from "@/stores";
import { Position, DefaultCameraProps } from "@/types/map";

export const MapViewComponent: FC<
  {
    mapRef?: RefCallback<any>;
    defaultCameraProps?: DefaultCameraProps;
    center: Omit<Position, "accuracy">;
    zoom?: number;
    pitch?: number;
  } & Omit<MapViewProps, "camera">
> = observer(
  ({
    mapRef,
    center,
    zoom,
    pitch,
    defaultCameraProps = { pitch: 45, zoom: 20, heading: 0, altitude: 100 },
    ...mapViewProps
  }) => {
    const mapViewRef = useRef(null);

    mapRef &&
      useEffect(() => {
        mapRef(mapViewRef.current);
      }, [mapViewRef.current]);

    useEffect(() => {
      if (!mapViewRef.current) return;

      (mapViewRef.current as any).animateCamera(
        {
          ...defaultCameraProps,
          pitch: pitch ?? defaultCameraProps.pitch,
          zoom: zoom ?? defaultCameraProps.zoom,
          center,
        },
        200,
      );
    }, [center]);

    return (
      <MapView
        {...mapViewProps}
        ref={mapViewRef}
        provider="google"
        showsBuildings={false}
        showsIndoors={false}
        customMapStyle={UIStore.theme.mapStyle}
        initialCamera={{
          center,
          ...defaultCameraProps,
          zoom: zoom ?? defaultCameraProps.zoom,
        }}
      ></MapView>
    );
  },
);
