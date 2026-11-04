import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    Geolocation.requestAuthorization();
    return true;
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Quyền truy cập vị trí',
          message: 'Ứng dụng cần quyền vị trí để gửi tọa độ hiện tại của bạn trong tin nhắn.',
          buttonPositive: 'Đồng ý',
          buttonNegative: 'Hủy',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }

  return true;
};

export const getCurrentLocation = async (): Promise<LocationCoords> => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('PERMISSION_DENIED');
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        console.warn('Geolocation error:', error);
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  });
};

export const openLocationInMap = async (latitude: number, longitude: number): Promise<void> => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    Alert.alert('Lỗi', 'Tọa độ vị trí không hợp lệ.');
    return;
  }

  const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const nativeUrl = Platform.select({
    ios: `maps:0,0?q=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(Vị trí)`,
    default: webUrl,
  });

  try {
    // 1. Thử mở ứng dụng bản đồ gốc (Google Maps / Apple Maps)
    if (nativeUrl && nativeUrl !== webUrl) {
      try {
        await Linking.openURL(nativeUrl);
        return;
      } catch (nativeErr) {
        // Nếu không có app bản đồ gốc (ví dụ trên emulator), chuyển sang mở URL web
      }
    }

    // 2. Mở trực tiếp link web Google Maps
    await Linking.openURL(webUrl);
  } catch (error) {
    console.warn('Error opening maps:', error);
    try {
      // 3. Fallback link dạng ngắn
      await Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    } catch (fallbackErr) {
      Alert.alert('Lỗi', 'Không thể mở ứng dụng bản đồ hoặc trình duyệt web.');
    }
  }
};
