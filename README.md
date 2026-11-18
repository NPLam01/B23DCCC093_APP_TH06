
## 🔥 Hướng dẫn cấu hình Firebase

### Bước 1: Tạo project Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Google.
2. Nhấn **Add project** (Tạo dự án mới), nhập tên dự án (ví dụ: `chatapp-28b1a`), tắt/bật Google Analytics tùy ý và nhấn **Create project**.

### Bước 2: Bật Firebase Authentication
1. Tại menu bên trái, vào **Build** ➜ **Authentication** ➜ Chọn **Get started**.
2. Tại tab **Sign-in method**, nhấp chọn **Email/Password**.
3. Bật công tắc **Enable** ở mục đầu tiên (Email/Password), sau đó nhấn **Save**.

### Bước 3: Tạo Firebase Realtime Database
1. Tại menu bên trái, vào **Build** ➜ **Realtime Database** ➜ Chọn **Create Database**.
2. Chọn vị trí lưu trữ máy chủ: Khuyên dùng **Singapore (`asia-southeast1`)** để đạt tốc độ cao nhất tại Việt Nam.
3. Chọn chế độ bảo mật khởi tạo: **Start in locked mode** rồi nhấn **Enable**.
4. Ghi lại URL của Realtime Database (ví dụ: `https://chatapp-28b1a-default-rtdb.asia-southeast1.firebasedatabase.app`).

### Bước 4: Thiết lập Security Rules cho Realtime Database
1. Trong mục **Realtime Database**, chọn tab **Rules**.
2. Sao chép toàn bộ nội dung từ tệp [`database.rules.json`](database.rules.json) trong dự án và dán vào:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "conversations": {
      ".read": "auth != null",
      "$convId": {
        ".write": "auth != null"
      }
    },
    "messages": {
      "$convId": {
        ".read": "auth != null",
        "$msgId": {
          ".write": "auth != null && (!data.exists() || (newData.child('recalled').val() === true ? data.child('senderId').val() === auth.uid : true))",
          "reactions": {
            "$uid": {
              ".write": "auth != null && auth.uid === $uid"
            }
          }
        }
      }
    },
    "userConversations": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        "$convId": {
          ".write": "auth != null"
        }
      }
    },
    "userChats": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        "$convId": {
          ".write": "auth != null"
        }
      }
    },
    "readStatus": {
      "$convId": {
        ".read": "auth != null",
        "$uid": {
          ".write": "auth != null && auth.uid === $uid"
        }
      }
    },
    "typing": {
      "$convId": {
        ".read": "auth != null",
        "$uid": {
          ".write": "auth != null && auth.uid === $uid"
        }
      }
    },
    "notifications": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        "$notifId": {
          ".write": "auth != null"
        }
      }
    }
  }
}
```
3. Nhấn **Publish** để áp dụng.

> **Ghi chú**: Nếu bạn đã cài đặt Firebase CLI trên máy tính, bạn chỉ cần chạy lệnh sau để triển khai luật tự động:
> ```bash
> npx firebase-tools deploy --only database --project <TÊN_PROJECT_CỦA_BẠN>
> ```

### Bước 5: Lấy thông số cấu hình Web App vào dự án
1. Vào **Project Settings** (biểu tượng bánh răng ⚙️ ở góc trên bên trái) ➜ Tab **General**.
2. Cuộn xuống phần **Your apps**, chọn biểu tượng Web **`</>`**.
3. Đặt tên gợi nhớ cho ứng dụng web (ví dụ: `bluetalk-web`) và nhấn **Register app**.
4. Sao chép đối tượng `firebaseConfig` được hiển thị.
5. Mở tệp [`src/services/firebase.ts`](src/services/firebase.ts) trong dự án và thay thế bằng các giá trị thực tế của bạn:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "chatapp-28b1a.firebaseapp.com",
  databaseURL: "https://chatapp-28b1a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chatapp-28b1a",
  storageBucket: "chatapp-28b1a.firebasestorage.app",
  messagingSenderId: "840558334655",
  appId: "1:840558334655:web:...",
};
```

---

## ☁️ Hướng dẫn cấu hình Cloudinary

Đề bài yêu cầu: *Tải lên Cloudinary bằng **unsigned upload preset** và không đưa API Secret vào mã nguồn client*.

### Bước 1: Đăng ký tài khoản Cloudinary
1. Truy cập [cloudinary.com](https://cloudinary.com/) và đăng ký 1 tài khoản miễn phí (hỗ trợ đăng nhập nhanh bằng Google/GitHub).
2. Sau khi đăng nhập, hệ thống sẽ đưa bạn vào trang **Dashboard**.

### Bước 2: Lấy Cloud Name
- Tại đầu trang **Dashboard** (hoặc góc trên bên trái thanh điều hướng), tìm và sao chép mục **Cloud name** (ví dụ: `dxyz12345` hoặc `chatapp-demo`).

### Bước 3: Tạo Unsigned Upload Preset
1. Nhấp vào biểu tượng **Cài đặt (⚙️)** ở góc dưới bên trái màn hình.
2. Chọn tab **Upload** trong menu cài đặt.
3. Cuộn xuống phần **Upload presets**:
   - Nếu thấy tùy chọn **Enable unsigned uploading**, hãy bật nó lên.
   - Nhấn vào nút **Add upload preset**.
4. Thiết lập thông số:
   - **Upload preset name**: Nhập tên preset bạn muốn (ví dụ: `th6_chat` hoặc để mặc định).
   - **Signing Mode**: **BẮT BUỘC chọn `Unsigned`** *(Nếu để Signed, Cloudinary sẽ từ chối và báo lỗi `Unknown API key`)*.
   - *(Tùy chọn)*: Trong mục **Folder**, bạn có thể nhập `chat_images` để gom ảnh vào 1 thư mục riêng.
5. Nhấn **Save** ở góc trên bên phải để lưu.

### Bước 4: Cập nhật thông số vào dự án
Mở tệp [`src/services/uploadService.ts`](src/services/uploadService.ts) (dòng 13) và điền 2 giá trị bạn vừa tạo:

```typescript
export const CLOUDINARY_CONFIG = {
  cloudName: 'TÊN_CLOUD_NAME_CỦA_BẠN',       // Ví dụ: 'dxyz12345'
  uploadPreset: 'TÊN_UPLOAD_PRESET_CỦA_BẠN', // Ví dụ: 'th6_chat'
};
```

---

## 🚀 Cài đặt & Khởi chạy ứng dụng

### Yêu cầu môi trường
- **Node.js**: Phiên bản $\ge$ 18.x
- **JDK**: OpenJDK 17
- **Android Studio**: Android SDK Platform 34 hoặc 35, Android SDK Build-Tools, Android Emulator
- **Cấu hình biến môi trường**: Đã cài đặt `ANDROID_HOME` và thêm `platform-tools` vào PATH

### Các bước khởi chạy

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Chạy kiểm thử unit test & kiểm tra TypeScript:**
   ```bash
   # Kiểm tra lỗi type
   npx tsc --noEmit

   # Chạy Jest test suites (7/7 passed)
   npm test
   ```

3. **Mở máy ảo Android:**
   - Mở Android Studio ➜ Device Manager ➜ Start máy ảo Android (Pixel, API 33-35).

4. **Khởi động Metro Bundler:**
   ```bash
   npm start
   ```

5. **Biên dịch và chạy ứng dụng lên thiết bị Android:**
   Mở một cửa sổ dòng lệnh mới và chạy:
   ```bash
   npm run android
   ```

---



## 🛠️ Xử lý lỗi thường gặp (Troubleshooting)

### 1. Lỗi `PERMISSION_DENIED: Permission denied`
- **Nguyên nhân**: Realtime Database trên Firebase Console chưa cập nhật Security Rules đầy đủ cho các node mới (`messages`, `typing`, `readStatus`, `notifications`, `userConversations`).
- **Cách khắc phục**: Vào Firebase Console ➜ Realtime Database ➜ Rules ➜ Dán nội dung trong tệp [`database.rules.json`](database.rules.json) và nhấn **Publish**.

### 2. Lỗi `Upload image failed: Error: Unknown API key`
- **Nguyên nhân**:
  1. `cloudName` hoặc `uploadPreset` trong `uploadService.ts` chưa được thay bằng tài khoản Cloudinary thực tế của bạn.
  2. Upload Preset trên Cloudinary Console đang để chế độ **Signed** thay vì **Unsigned**.
- **Cách khắc phục**: Vào Cloudinary ➜ Settings ➜ Upload ➜ Upload presets ➜ Chỉnh sửa preset và chọn **Signing Mode = Unsigned** ➜ Lưu lại và cập nhật vào [`src/services/uploadService.ts`](src/services/uploadService.ts).

### 3. Đăng ký tài khoản bị xoay tròn không vào được
- **Nguyên nhân**: Trước đây tệp `src/services/firebase.ts` có lệnh kết nối Auth Emulator `10.0.2.2:9099` trong khi máy tính không chạy emulator cục bộ.
- **Cách khắc phục**: Dự án hiện tại đã kết nối trực tiếp lên dịch vụ Firebase đám mây chính thức, đảm bảo máy tính và máy ảo có kết nối mạng Internet.

### 4. Không mở được bản đồ vị trí Google Maps
- **Nguyên nhân**: Android 11+ (API 30+) yêu cầu khai báo bộ lọc Package Visibility `<queries>` trong `AndroidManifest.xml` để cho phép `Linking.canOpenURL`.
- **Cách khắc phục**: Dự án đã cấu hình sẵn các thẻ intent `https` và `geo` trong `android/app/src/main/AndroidManifest.xml`, tự động mở ứng dụng Google Maps hoặc trình duyệt khi bấm vào tin nhắn vị trí.

---

*Chúc các bạn hoàn thành xuất sắc Bài Thực Hành! 🚀*
