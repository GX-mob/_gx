import React, { useState, useEffect } from "react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { AnimatedSetup } from "@/components/general";
import {
  MapViewComponent,
  SelfMark,
  UserMark,
  RoutePointMark,
} from "@/components/map";
import { CreateRideStore } from "@/states";
import { Polyline } from "react-native-maps";

export const CreateRideScreen = observer(() => {
  const storedCenter = toJS(CreateRideStore.center);
  const [center, setCenter] = useState(storedCenter);

  const line = [
    [-9.572565, -35.776631],
    [-9.572663, -35.776646],
    [-9.57281, -35.776654],
    [-9.572831, -35.776497],
    [-9.572841, -35.776267],
    [-9.572756, -35.776236],
    [-9.57272, -35.776202],
    [-9.572647, -35.776055],
    [-9.572583, -35.775927],
    [-9.572485, -35.775744],
    [-9.572408, -35.775566],
    [-9.572266, -35.775258],
  ];

  useEffect(() => {
    setCenter(storedCenter);
  }, [storedCenter]);

  useEffect(() => {
    CreateRideStore.watchPosition();
    return () => {
      CreateRideStore.positionWatcher?.remove();
    };
  }, []);

  const marks = toJS(CreateRideStore.marks);

  return (
    <AnimatedSetup
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <MapViewComponent
        style={{ width: "100%", height: "100%" }}
        center={center}
        defaultCameraProps={{
          pitch: 45,
          zoom: 20,
          heading: 0,
          altitude: 100,
        }}
        zoom={CreateRideStore.mapZoom}
        onTouchEnd={() => {
          console.log("touch end");
          CreateRideStore.disableAutoReposition();
        }}
      >
        <Polyline
          strokeWidth={3}
          strokeColor="#0066ff"
          coordinates={line.map(([latitude, longitude]) => ({
            latitude,
            longitude,
          }))}
        />
        {Object.entries(marks).map(([id, content]) => {
          switch (content.type) {
            case "self":
              return (
                <SelfMark
                  key={id}
                  pitch={45}
                  position={content.position}
                ></SelfMark>
              );
            case "user":
              return (
                <UserMark position={content.position} avatar={content.avatar} />
              );
            case "routePoint":
              // todo
              return (
                <RoutePointMark
                  key={id}
                  position={content.position}
                  location={content.pointLocation}
                ></RoutePointMark>
              );
            default:
              return null;
          }
        })}
      </MapViewComponent>
    </AnimatedSetup>
  );
});
