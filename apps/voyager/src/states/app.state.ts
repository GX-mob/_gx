import { observable, action } from "mobx";
import SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-community/async-storage";
import { TOKEN_STORAGE_KEY } from "@/constants";

class AppState {
  private secureStorageAvailable!: boolean;

  @observable initializing = false;
  @observable token = "";

  constructor() {
    this.init();
  }

  @action
  async init() {
    try {
      this.secureStorageAvailable = await SecureStore.isAvailableAsync();
    } catch (e) {}

    const token = await this.getItem(TOKEN_STORAGE_KEY);

    if (token) {
      this.token = token;
    }

    this.initializing = false;
  }

  getItem(key: string) {
    return this.secureStorageAvailable
      ? SecureStore.getItemAsync(key)
      : AsyncStorage.getItem(key);
  }

  setItem(key: string, value: any) {
    if (this.secureStorageAvailable) {
      return SecureStore.setItemAsync(key, value);
    }

    return AsyncStorage.setItem(key, value);
  }

  removeItem(key: string) {
    if (this.secureStorageAvailable) {
      return SecureStore.deleteItemAsync(key);
    }

    return AsyncStorage.removeItem(key);
  }

  setToken(token: string) {
    this.token = token;
    return this.setItem(TOKEN_STORAGE_KEY, token);
  }

  removeToken() {
    this.token = "";
    return this.removeItem(TOKEN_STORAGE_KEY);
  }
}

export default new AppState();
