-- ====================================================================
--  DiemSuong SPA — Postgres schema (chạy 1 lần trên Neon)
--  Đặt schema mặc định "public". Tên bảng giữ PascalCase nên mọi câu
--  query trực tiếp phải dùng dấu nháy kép, ví dụ:  select * from "DichVu";
-- ====================================================================

BEGIN;

-- ---------------- NhanVien ----------------
CREATE TABLE IF NOT EXISTS "NhanVien" (
    "Id"               SERIAL PRIMARY KEY,
    "HoTen"            VARCHAR(200) NOT NULL,
    "GioiTinh"         VARCHAR(5)   NOT NULL,
    "DienThoai"        VARCHAR(20)  NOT NULL,
    "DiaChi"           VARCHAR(200),
    "ChucVu"           VARCHAR(50)  NOT NULL,
    "DbLoginName"      VARCHAR(128) NOT NULL,
    "IsActive"         BOOLEAN      NOT NULL DEFAULT TRUE,
    "PasswordSalt"     BYTEA,
    "PasswordHashSha"  BYTEA
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_NhanVien_DbLoginName" ON "NhanVien"("DbLoginName");

-- ---------------- DanhMucDichVu ----------------
CREATE TABLE IF NOT EXISTS "DanhMucDichVu" (
    "Id"          SERIAL PRIMARY KEY,
    "MaDanhMuc"   VARCHAR(50)  NOT NULL,
    "TenDanhMuc"  VARCHAR(200) NOT NULL,
    "MoTa"        VARCHAR(1000),
    "ThuTu"       INT          NOT NULL DEFAULT 0,
    "IsActive"    BOOLEAN      NOT NULL DEFAULT TRUE,
    "CreatedAt"   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"   TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_DanhMucDichVu_MaDanhMuc" ON "DanhMucDichVu"("MaDanhMuc");
CREATE INDEX IF NOT EXISTS "IX_DanhMucDichVu_TenDanhMuc" ON "DanhMucDichVu"("TenDanhMuc");

-- ---------------- DichVu ----------------
CREATE TABLE IF NOT EXISTS "DichVu" (
    "Id"                      SERIAL PRIMARY KEY,
    "DanhMucId"               INT          REFERENCES "DanhMucDichVu"("Id") ON DELETE RESTRICT,
    "MaDichVu"                VARCHAR(50)  NOT NULL,
    "TenDichVu"               VARCHAR(200) NOT NULL,
    "MoTaNgan"                VARCHAR(500),
    "MoTa"                    TEXT,
    "LieuTrinh"               TEXT,
    "GhiChuNoiBo"             VARCHAR(1000),
    "GiaHienTai"              NUMERIC(18,2) NOT NULL DEFAULT 0,
    "GiaGoc"                  NUMERIC(18,2),
    "PhanTramGiam"            NUMERIC(5,2),
    "ApDungTu"                TIMESTAMP,
    "ApDungDen"               TIMESTAMP,
    "ThoiLuongPhut"           INT          NOT NULL DEFAULT 60,
    "SoBuoi"                  INT,
    "ThoiGianHieuLucNgay"     INT,
    "SKU"                     VARCHAR(50),
    "Barcode"                 VARCHAR(50),
    "IsCombo"                 BOOLEAN      NOT NULL DEFAULT FALSE,
    "IsOnlineVisible"         BOOLEAN      NOT NULL DEFAULT TRUE,
    "IsActive"                BOOLEAN      NOT NULL DEFAULT TRUE,
    "ThuTuHienThi"            INT          NOT NULL DEFAULT 0,
    "HinhAnhChinh"            VARCHAR(500),
    "HinhAnhJson"             TEXT,
    "Slug"                    VARCHAR(250),
    "MetaTitle"               VARCHAR(250),
    "MetaDescription"         VARCHAR(500),
    "CreatedAt"               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"               TIMESTAMP,
    "CreatedBy"               VARCHAR(128),
    "UpdatedBy"               VARCHAR(128)
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_DichVu_MaDichVu" ON "DichVu"("MaDichVu");
CREATE INDEX IF NOT EXISTS "IX_DichVu_TenDichVu" ON "DichVu"("TenDichVu");
CREATE INDEX IF NOT EXISTS "IX_DichVu_DanhMucId" ON "DichVu"("DanhMucId");
CREATE INDEX IF NOT EXISTS "IX_DichVu_IsActive_IsOnlineVisible" ON "DichVu"("IsActive","IsOnlineVisible");

-- ---------------- LichHen ----------------
CREATE TABLE IF NOT EXISTS "LichHen" (
    "Id"                SERIAL PRIMARY KEY,
    "HoTenKhach"        VARCHAR(200) NOT NULL,
    "DienThoaiKhach"    VARCHAR(20)  NOT NULL,
    "EmailKhach"        VARCHAR(100),
    "NgayHen"           DATE         NOT NULL,
    "GioHen"            TIME         NOT NULL,
    "ThoiLuongDuKien"   INT          NOT NULL DEFAULT 60,
    "NhanVienId"        INT,
    "DichVuId"          INT          NOT NULL REFERENCES "DichVu"("Id") ON DELETE RESTRICT,
    "GhiChuKhach"       VARCHAR(500),
    "GhiChuNoiBo"       VARCHAR(1000),
    "TrangThai"         VARCHAR(50)  NOT NULL DEFAULT 'Chờ xác nhận',
    "LyDoHuy"           VARCHAR(500),
    "CreatedAt"         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"         TIMESTAMP,
    "CreatedBy"         VARCHAR(128),
    "UpdatedBy"         VARCHAR(128),
    "DaDen"             BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS "IX_LichHen_NgayHen" ON "LichHen"("NgayHen");
CREATE INDEX IF NOT EXISTS "IX_LichHen_TrangThai" ON "LichHen"("TrangThai");

-- ---------------- LienHe ----------------
CREATE TABLE IF NOT EXISTS "LienHe" (
    "Id"         SERIAL PRIMARY KEY,
    "HoTen"      VARCHAR(200)  NOT NULL,
    "DienThoai"  VARCHAR(20)   NOT NULL,
    "Email"      VARCHAR(100),
    "LoiNhan"    VARCHAR(2000) NOT NULL,
    "CreatedAt"  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DaXem"      BOOLEAN       NOT NULL DEFAULT FALSE,
    "XemLuc"     TIMESTAMP,
    "XemBoi"     VARCHAR(128)
);
CREATE INDEX IF NOT EXISTS "IX_LienHe_DaXem"     ON "LienHe"("DaXem");
CREATE INDEX IF NOT EXISTS "IX_LienHe_CreatedAt" ON "LienHe"("CreatedAt" DESC);

-- ---------------- BaiViet ----------------
CREATE TABLE IF NOT EXISTS "BaiViet" (
    "Id"               SERIAL PRIMARY KEY,
    "Slug"             VARCHAR(250) NOT NULL,
    "TieuDe"           VARCHAR(250) NOT NULL,
    "MoTaNgan"         VARCHAR(500),
    "NoiDung"          TEXT,
    "DanhMuc"          VARCHAR(100),
    "AnhBia"           VARCHAR(500),
    "VideoUrl"         VARCHAR(500),
    "TacGia"           VARCHAR(100),
    "ThoiGianDocPhut"  INT,
    "IsPublished"      BOOLEAN      NOT NULL DEFAULT FALSE,
    "NgayDang"         TIMESTAMP,
    "CreatedAt"        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"        TIMESTAMP,
    "CreatedBy"        VARCHAR(128),
    "UpdatedBy"        VARCHAR(128),
    CONSTRAINT "UQ_BaiViet_Slug" UNIQUE ("Slug")
);
CREATE INDEX IF NOT EXISTS "IX_BaiViet_IsPublished" ON "BaiViet"("IsPublished");
CREATE INDEX IF NOT EXISTS "IX_BaiViet_NgayDang"    ON "BaiViet"("NgayDang" DESC);

COMMIT;

-- ====================================================================
--  Seed dữ liệu mẫu (tuỳ chọn) — bỏ comment để chạy.
--  Mật khẩu admin mặc định = "admin" (hash bcrypt). BẮT BUỘC đổi ngay.
-- ====================================================================
-- INSERT INTO "DanhMucDichVu" ("MaDanhMuc","TenDanhMuc","IsActive")
-- VALUES ('LB','Làm đẹp',TRUE),('MS','Massage',TRUE),('GD','Gội đầu',TRUE);

-- INSERT INTO "DichVu" ("DanhMucId","MaDichVu","TenDichVu","GiaHienTai","ThoiLuongPhut","IsActive","IsOnlineVisible")
-- VALUES (2,'MS-001','Massage body 60 phút',450000,60,TRUE,TRUE);
