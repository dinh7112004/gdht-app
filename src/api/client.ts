import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// export const BASE_URL = 'https://gdht-backend.onrender.com';

export const BASE_URL = 'https://app-gdds.iclever.vn';

export const resolveImageUrl = (url: string | null | undefined) => {
  const DEFAULT_IMG = "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400";
  if (!url || !url.trim()) return DEFAULT_IMG;

  // Chuyển Google Drive sharing URL sang URL ảnh trực tiếp (uc?export=view hoạt động không cần auth)
  // Dạng: https://drive.google.com/file/d/FILE_ID/view...
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (driveFileMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveFileMatch[1]}`;
  }
  // Dạng: https://drive.google.com/open?id=FILE_ID
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (driveOpenMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveOpenMatch[1]}`;
  }
  // Dạng: https://drive.google.com/uc?id=FILE_ID (không có export=view)
  const driveUcMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
  if (driveUcMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveUcMatch[1]}`;
  }

  // Convert old lh3.googleusercontent.com/d/FILE_ID to uc?export=view format
  const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([^?/]+)/);
  if (lh3Match) {
    return `https://drive.google.com/uc?export=view&id=${lh3Match[1]}`;
  }

  // Nếu URL chứa local IP (192.168.x.x hoặc 10.x.x.x hoặc localhost), thay thế bằng BASE_URL hiện tại
  const localIpPattern = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|localhost|127\.0\.0\.1)(:\d+)?/;
  if (localIpPattern.test(url)) {
    const path = url.replace(localIpPattern, '');
    return `${BASE_URL}${path}`;
  }

  if (url.startsWith('http')) return url;
  // Base64 data URI — trả về nguyên không xử lý
  if (url.startsWith('data:')) return url;
  // Handle local uploads
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${cleanUrl}`;
};

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Add a request interceptor to attach the token
client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;
