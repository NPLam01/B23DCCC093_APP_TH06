import { Platform, PermissionsAndroid, Alert } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';

/**
 * Cấu hình Cloudinary (chỉ sử dụng unsigned upload preset theo yêu cầu bảo mật).
 * Người dùng có thể thay thế bằng cloud_name và upload_preset của mình.
 */
export const CLOUDINARY_CONFIG = {
  cloudName: 'py54eg2q', // Cloud name mẫu hoặc cấu hình của sinh viên
  uploadPreset: 'th6-chat', // Unsigned upload preset
};

/**
 * Xin quyền Camera trên Android
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Quyền truy cập Máy ảnh',
          message: 'BlueTalk cần quyền truy cập máy ảnh để chụp và gửi ảnh trong cuộc trò chuyện.',
          buttonPositive: 'Đồng ý',
          buttonNegative: 'Hủy',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  }
  return true;
};

/**
 * Chụp ảnh từ Camera (tự động thu nhỏ cạnh dài <= 1024px)
 */
export const pickFromCamera = async (): Promise<Asset | null> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    Alert.alert(
      'Quyền bị từ chối',
      'Bạn cần cấp quyền truy cập máy ảnh trong Cài đặt để sử dụng tính năng chụp ảnh.',
    );
    return null;
  }

  const response: ImagePickerResponse = await launchCamera({
    mediaType: 'photo',
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    saveToPhotos: false,
  });

  if (response.didCancel) return null;
  if (response.errorCode) {
    Alert.alert('Lỗi máy ảnh', response.errorMessage || 'Không thể chụp ảnh.');
    return null;
  }
  return response.assets && response.assets.length > 0 ? response.assets[0] : null;
};

/**
 * Chọn ảnh từ Thư viện (tự động thu nhỏ cạnh dài <= 1024px)
 */
export const pickFromGallery = async (): Promise<Asset | null> => {
  const response: ImagePickerResponse = await launchImageLibrary({
    mediaType: 'photo',
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    selectionLimit: 1,
  });

  if (response.didCancel) return null;
  if (response.errorCode) {
    Alert.alert('Lỗi thư viện', response.errorMessage || 'Không thể chọn ảnh.');
    return null;
  }
  return response.assets && response.assets.length > 0 ? response.assets[0] : null;
};

/**
 * Tải ảnh lên Cloudinary qua unsigned upload preset
 * Trả về secure_url của ảnh
 */
export const uploadImageToCloudinary = async (
  uri: string,
  type: string = 'image/jpeg',
  name: string = 'chat_image.jpg',
): Promise<string> => {
  const data = new FormData();
  data.append('file', {
    uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
    type: type || 'image/jpeg',
    name: name || 'photo.jpg',
  } as any);

  data.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

  const res = await fetch(endpoint, {
    method: 'POST',
    body: data,
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    const errorMsg = json.error?.message || '';
    if (errorMsg.includes('Unknown API key') || errorMsg.includes('Upload preset')) {
      throw new Error(
        `Cloudinary (${CLOUDINARY_CONFIG.cloudName}): ${errorMsg}. Vui lòng kiểm tra Cloud Name và Unsigned Upload Preset trong src/services/uploadService.ts`,
      );
    }
    throw new Error(errorMsg || 'Không thể tải ảnh lên Cloudinary.');
  }

  return json.secure_url || json.url;
};

