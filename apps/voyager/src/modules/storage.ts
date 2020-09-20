import AsyncStorage from "@react-native-community/async-storage";

class Storage {
  get(key: string) {
    return AsyncStorage.getItem(key);
  }
  set(key: string, value: any) {
    return AsyncStorage.setItem(key, value);
  }
  del(key: string) {
    return AsyncStorage.removeItem(key);
  }
}

export default new Storage();
