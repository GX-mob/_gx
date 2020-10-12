export type Position = {
  latitude: number;
  longitude: number;
  heading: number | null;
  accuracy: number | null;
};

export type DefaultCameraProps = {
  pitch: number;
  zoom: number;
  heading: number;
  altitude: number;
};

export type RoutePointLocation = "start" | "end";
