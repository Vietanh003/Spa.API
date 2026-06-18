# Deploy DiemSuong SPA (Free, không cần credit card)

Stack:

| Phần | Dịch vụ | Free tier |
|---|---|---|
| Frontend | Vercel | Hobby, không giới hạn bandwidth |
| Backend | Render Web Service (Docker) | 750h/tháng, sleep sau 15p idle |
| Database | Neon Postgres | 0.5 GB, không hết hạn |
| File / video | Cloudinary | 25 GB storage |

Đẩy 2 repo lên GitHub trước:
- `admin-spa` — frontend (Vite React)
- `Spa.API` — backend (.NET 10)

Hoặc 1 monorepo cũng OK; phải set Root Directory tương ứng ở Vercel/Render.

---

## 1. Tạo database trên Neon

1. Vào https://neon.tech → đăng ký bằng GitHub (miễn phí, không cần thẻ).
2. **Create Project** → đặt tên (vd `diemsuong-spa`) → chọn region gần Việt Nam (Singapore).
3. Vào tab **SQL Editor** → mở file [`Spa.API/Spa.API/DB/init-postgres.sql`](../Spa.API/Spa.API/DB/init-postgres.sql) ở repo → paste toàn bộ → bấm **Run**.
4. Vào tab **Dashboard** → khối **Connection string** → copy `Connection string` dạng:
   ```
   postgresql://user:pass@ep-xxx-pooler.aws.neon.tech/dbname?sslmode=require
   ```
   Lưu lại — sẽ dán vào Render.

---

## 2. Tạo tài khoản Cloudinary

1. Vào https://cloudinary.com → đăng ký (free, không cần thẻ).
2. Sau khi đăng nhập, ở **Dashboard** copy giá trị **API Environment variable** dạng:
   ```
   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
   ```
   Lưu lại.

---

## 3. Deploy backend lên Render

1. Vào https://render.com → đăng ký bằng GitHub.
2. **New +** → **Web Service** → connect repo chứa thư mục `Spa.API/`.
3. Cấu hình:
   - **Name**: `diemsuong-spa-api`
   - **Region**: Singapore
   - **Root Directory**: `Spa.API` *(thư mục chứa `Dockerfile`)*
   - **Runtime**: Docker
   - **Branch**: `main`
   - **Instance Type**: Free
4. **Environment** → thêm các biến:
   | Key | Value |
   |---|---|
   | `ConnectionStrings__Default` | (paste connection string từ Neon) |
   | `Jwt__Key` | (chuỗi ngẫu nhiên ≥ 32 ký tự — tạo bằng `openssl rand -base64 48`) |
   | `Jwt__Issuer` | `DiemSuong.Api` |
   | `Jwt__Audience` | `DiemSuong.Api` |
   | `Jwt__ExpireMinutes` | `720` |
   | `Cors__Origins` | URL Vercel của frontend (vd `https://diemsuong-spa.vercel.app`) — tạm để `*` rồi cập nhật sau |
   | `CLOUDINARY_URL` | (paste từ Cloudinary) |
   | `SETUP_TOKEN` | (chuỗi ngẫu nhiên — chỉ dùng 1 lần để seed admin, sau đó xoá) |
5. **Create Web Service** → đợi build xong (~3-5 phút).
6. Test: mở `https://<your-app>.onrender.com/health` → phải trả `{"ok":true}`.

### Tạo tài khoản admin đầu tiên

```bash
curl -X POST https://<your-app>.onrender.com/api/setup/seed-admin \
  -H "Content-Type: application/json" \
  -H "X-Setup-Token: <giá trị SETUP_TOKEN ở Render>" \
  -d '{"dbLoginName":"admin","password":"<mật khẩu mạnh>","hoTen":"Quản trị"}'
```

Sau khi tạo xong: vào Render → Environment → **xoá biến `SETUP_TOKEN`** (vô hiệu hoá endpoint setup).

---

## 4. Deploy frontend lên Vercel

1. Vào https://vercel.com → đăng ký bằng GitHub.
2. **Add New** → **Project** → chọn repo chứa `admin-spa/`.
3. Cấu hình:
   - **Framework Preset**: Vite (auto detect)
   - **Root Directory**: `admin-spa` *(nếu là monorepo)*
   - **Build Command**: `npm run build` (mặc định)
   - **Output Directory**: `dist` (mặc định)
4. **Environment Variables**:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | URL Render của backend, vd `https://diemsuong-spa-api.onrender.com` |
5. **Deploy** → đợi ~2 phút.
6. Sau khi deploy thành công, lấy URL Vercel (vd `https://diemsuong-spa.vercel.app`) → **quay lại Render** → cập nhật `Cors__Origins = https://diemsuong-spa.vercel.app` → save → Render tự deploy lại.

---

## 5. Kiểm tra

- Mở URL Vercel → trang chủ hiển thị.
- Mở `/login` → đăng nhập bằng `admin` + password đã set ở bước 3.
- Tạo 1 dịch vụ, upload ảnh → ảnh phải lên Cloudinary và URL dạng `https://res.cloudinary.com/...`.
- Thử đặt lịch ở `/booking` → mở `/admin/lich-hen` → bấm Xác nhận → hoạt động.

---

## 6. Lưu ý vận hành

- **Render free sleep sau 15p idle**: request đầu sau khi sleep mất ~30-60s để wake. Có thể dùng cron service như https://cron-job.org để ping `/health` mỗi 10p — giữ instance warm.
- **Neon free auto-suspend sau 5p idle**: query đầu tiên mất 1-2s reconnect. Không cần làm gì thêm.
- **Cloudinary**: 25GB storage + 25k transformations/tháng. Tài khoản free đủ cho mọi spa nhỏ.
- **Đổi mật khẩu / khoá Jwt**: cứ vào Render → Environment → sửa giá trị → Render auto deploy lại.

---

## 7. Local dev sau khi đã migrate

Đặt biến môi trường cho dev:
```
ConnectionStrings__Default=Host=localhost;Port=5432;Username=postgres;Password=postgres;Database=spadb
CLOUDINARY_URL=cloudinary://...   # dùng chung free account cũng được
Jwt__Key=any-long-string-for-dev
SETUP_TOKEN=dev-only
```

Cài Postgres local rồi chạy:
```bash
psql -U postgres -d spadb -f Spa.API/DB/init-postgres.sql
dotnet run --project Spa.API/Spa.API/Spa.API.csproj
```

Frontend: bỏ trống `VITE_API_URL` rồi `npm run dev` — Vite proxy `/api` về `localhost:5200`.
