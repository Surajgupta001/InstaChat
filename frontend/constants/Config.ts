import { Platform } from "react-native";

const HOST = Platform.select({
    ios: '192.168.1.4',
    android: '192.168.1.4',
    default: 'localhost'
})

export const API_BASE_URL = `http://${HOST}:8000/api/v1`;
export const WS_BASE_URL = `ws://${HOST}:8000`;