import { Platform } from "react-native";
import { action, observable } from "mobx";
import { AnimatedRegion } from "react-native-maps";
import * as Location from "expo-location";

type Position = { latitude: number; longitude: number; heading: number };

const defaultCameraProps = { pitch: 45, zoom: 20, heading: 0, altitude: 100 };

class MainStore {
  mapRef: any;
  autoRepositionMode: "self" | "pickingup" = "self";
  marksRefs: Record<string, any> = {};

  @observable
  loading = true;

  @observable
  permissionStatus!: boolean;

  @observable
  positions: Record<
    string,
    { position: Position; region: AnimatedRegion }
  > = {};

  @action
  setPosition(id: string, position: any) {
    console.log("create or update position", id);
    if (id in this.marksRefs) {
      return this.moveMark(id, position);
    }

    this.createMark(id, position);
  }

  moveMark(id: string, position: any) {
    this.positions[id].region
      .timing({
        latitude: position.latitude,
        longitude: position.longitude,
        duration: 200,
        useNativeDriver: false,
      })
      .start();
  }

  createMark(id: string, position: any) {
    this.positions[id] = {
      position,
      region: new AnimatedRegion({
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }),
    };
  }

  @action
  async watchPosition() {
    try {
      this.loading = true;
      let { status } = await Location.requestPermissionsAsync();
      if (status !== "granted") {
        return (this.permissionStatus = false);
      }

      this.permissionStatus = true;

      Location.watchPositionAsync({}, (location) => {
        if (this.loading) {
          this.loading = false;
        }

        console.log("position event", location);
        const { latitude, longitude, heading } = location.coords;

        if (!this.mapRef) return;

        switch (this.autoRepositionMode) {
          case "self":
            this.handleMapSelfReposistion(location.coords);
            break;
          case "pickingup":
            this.setPosition("self", { latitude, longitude });
            this.handleMapPickingUpReposition(location.coords);
            break;
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  handleMapSelfReposistion({ latitude, longitude, heading }: any) {
    this.setPosition("self", { latitude, longitude, heading });
    this.setMapPosition({ latitude, longitude });
  }
  handleMapPickingUpReposition(coords: any) {}

  setMapPosition(center: Omit<Position, "heading">, zoom: number = 20) {
    this.mapRef.animateCamera(
      {
        center,
        ...defaultCameraProps,
        zoom,
      },
      200,
    );
  }
}

export default new MainStore();
