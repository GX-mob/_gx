import latLng, { LatLng } from "./lat-lng";

export type Location = {
  /**
   * Main title, contains the street name and may the number
   */
  main: string;
  /**
   * Secondary title, contains the district, city and state
   */
  secondary: string;
  /**
   * slug of district
   */
  district: string;
  /**
   * Latitude and longitude
   */
  latLng: LatLng;
};

export default {
  main: "string",
  secondary: "string",
  district: "string",
  latLng: latLng,
};
