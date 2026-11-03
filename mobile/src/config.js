import { Platform } from 'react-native';

// Android emulator reaches your computer at 10.0.2.2.
// On a real phone, use your computer's LAN IP, e.g. http://192.168.1.20:8080 (same Wi-Fi).
export const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
