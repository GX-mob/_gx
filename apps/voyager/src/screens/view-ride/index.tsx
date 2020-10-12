import React, { FC } from "react";
import { MapViewComponent } from "@components/map";
import { observer } from "mobx-react-lite";

export const ViewRideComponent: FC = observer(() => {
  return (
    <MapViewComponent
      center={{ latitude: -9.572544, longitude: -35.776623, heading: 0 }}
    ></MapViewComponent>
  );
});
