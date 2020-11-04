import { action, observable } from "mobx";
import * as Location from "expo-location";
import { Position, RoutePointLocation } from "@/types/map";

class CreateRideStore {
  @observable
  center: Omit<Position, "accuracy"> = {
    latitude: -11.914238,
    longitude: -49.819621,
    heading: 0,
  };
  @observable mapZoom = 4;
  @observable loading = true;
  @observable permissionStatus!: Location.LocationPermissionResponse["status"];
  @observable marks: Record<
    string,
    | { type: "self"; position: Position }
    | {
        type: "routePoint";
        position: Omit<Position, "heading" | "accuracy">;
        pointLocation: RoutePointLocation;
      }
    | { type: "user"; position: Position; avatar: string }
  > = {
    routeStart: {
      type: "routePoint",
      position: { latitude: -9.572565, longitude: -35.776631 },
      pointLocation: "start",
    },
    routeEnd: {
      type: "routePoint",
      position: { latitude: -9.572266, longitude: -35.775258 },
      pointLocation: "end",
    },
  };
  @observable positions: Record<string, Position> = {};

  positionWatcher?: { remove: () => void };
  stopAutoReposition = false;
  autoRepositionMode: "self" | "pickingup" = "self";
  resetAutoRepositionTimeout?: ReturnType<typeof setTimeout>;

  @action
  disableAutoReposition() {
    console.log("disable");
    this.stopAutoReposition = true;
    if (this.resetAutoRepositionTimeout)
      clearTimeout(this.resetAutoRepositionTimeout);

    this.resetAutoRepositionTimeout = setTimeout(() => {
      console.log("enable");
      this.stopAutoReposition = false;
      this.resetAutoRepositionTimeout = undefined;
    }, 15000);
  }

  @action
  async watchPosition() {
    try {
      this.loading = true;
      this.permissionStatus = (await Location.requestPermissionsAsync()).status;
      if (this.permissionStatus !== "granted") {
        return;
      }

      this.positionWatcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000,
        },
        (location) => {
          const { latitude, longitude, heading } = location.coords;

          console.log("location hit");
          if (this.loading) {
            console.log("set center L");
            this.center = { latitude, longitude, heading: heading || 0 };
            this.mapZoom = 20;
            this.loading = false;
          }

          switch (this.autoRepositionMode) {
            case "self":
              this.handleMapSelfReposistion(location.coords);
              break;
            case "pickingup":
              //this.setPosition("self", { latitude, longitude });
              this.handleMapPickingUpReposition(location.coords);
              break;
          }
        },
      );
    } catch (error) {
      console.error(error);
    }
  }

  handleMapSelfReposistion(position: Position) {
    const { latitude, longitude } = position;
    this.marks.self = { type: "self", position };

    if (this.stopAutoReposition) {
      return;
    }

    console.log("set center H");
    this.center = { latitude, longitude, heading: 0 };
  }
  handleMapPickingUpReposition(coords: any) {}
}

export default new CreateRideStore();
