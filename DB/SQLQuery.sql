CREATE TABLE dbo.NhanVien (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    HoTen           NVARCHAR(200) NOT NULL,
    GioiTinh        NVARCHAR(5) NOT NULL,
    DienThoai       NVARCHAR(20) NOT NULL,
    DiaChi          NVARCHAR(20) NULL,
    ChucVu          NVARCHAR(50) NOT NULL DEFAULT N'Owner', 
    DbLoginName     SYSNAME NOT NULL, 
    IsActive        BIT NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_NhanVien_DbLoginName UNIQUE (DbLoginName)
);
go

INSERT INTO dbo.NhanVien
(HoTen, GioiTinh, DienThoai, DiaChi, ChucVu, DbLoginName)
VALUES
(N'Chủ Spa', N'Nam', N'0900000000', N'TP.HCM', N'Owner', N'spa_owner');
go 

ALTER TABLE dbo.NhanVien
ALTER COLUMN DiaChi NVARCHAR(200) NULL;
go 

CREATE LOGIN spa_owner WITH PASSWORD = 'Spa@12345678', CHECK_POLICY = ON;

USE SpaDb;
CREATE USER spa_owner FOR LOGIN spa_owner;
go

ALTER ROLE db_owner ADD MEMBER spa_owner;

SELECT ORIGINAL_LOGIN() AS CurrentLogin;

SELECT *
FROM dbo.NhanVien
WHERE DbLoginName = ORIGINAL_LOGIN();



IF COL_LENGTH('dbo.NhanVien','PasswordHash') IS NULL
BEGIN
    ALTER TABLE dbo.NhanVien
    ADD PasswordHash NVARCHAR(200) NULL;
END
GO

USE SpaDb;
GO

IF COL_LENGTH('dbo.NhanVien', 'PasswordPlain') IS NULL
    ALTER TABLE dbo.NhanVien ADD PasswordPlain NVARCHAR(200) NULL;
GO

IF COL_LENGTH('dbo.NhanVien', 'PasswordSalt') IS NULL
    ALTER TABLE dbo.NhanVien ADD PasswordSalt VARBINARY(16) NULL;
GO

IF COL_LENGTH('dbo.NhanVien', 'PasswordHashSha') IS NULL
    ALTER TABLE dbo.NhanVien ADD PasswordHashSha VARBINARY(32) NULL;
GO

CREATE OR ALTER TRIGGER dbo.TR_NhanVien_HashPassword
ON dbo.NhanVien
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE nv
    SET
        PasswordSalt = ca.Salt,
        PasswordHashSha = HASHBYTES('SHA2_256', ca.Salt + CONVERT(VARBINARY(MAX), i.PasswordPlain)),
        PasswordPlain = NULL
    FROM dbo.NhanVien nv
    JOIN inserted i ON nv.Id = i.Id
    CROSS APPLY (SELECT CONVERT(VARBINARY(16), NEWID()) AS Salt) ca
    WHERE i.PasswordPlain IS NOT NULL AND LTRIM(RTRIM(i.PasswordPlain)) <> N'';
END
GO

INSERT INTO dbo.NhanVien (HoTen, GioiTinh, DienThoai, DiaChi, ChucVu, DbLoginName, PasswordPlain)
VALUES (N'Chủ Spa', N'Nam', N'0900000000', N'TP.HCM', N'Owner', N'spa_owner', N'123456');


SELECT ORIGINAL_LOGIN() AS CurrentLogin;

SELECT *
FROM dbo.NhanVien
WHERE DbLoginName = ORIGINAL_LOGIN();

USE SpaDb;
GO

IF OBJECT_ID('dbo.DanhMucDichVu', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DanhMucDichVu
    (
        Id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DanhMucDichVu PRIMARY KEY,
        MaDanhMuc       NVARCHAR(50)      NOT NULL,
        TenDanhMuc      NVARCHAR(200)     NOT NULL,
        MoTa            NVARCHAR(1000)    NULL,

        ThuTu           INT              NOT NULL CONSTRAINT DF_DanhMucDichVu_ThuTu DEFAULT(0),
        IsActive        BIT              NOT NULL CONSTRAINT DF_DanhMucDichVu_IsActive DEFAULT(1),

        CreatedAt       DATETIME2(0)     NOT NULL CONSTRAINT DF_DanhMucDichVu_CreatedAt DEFAULT(SYSDATETIME()),
        UpdatedAt       DATETIME2(0)     NULL
    );

    -- Unique mã danh mục
    CREATE UNIQUE INDEX UX_DanhMucDichVu_MaDanhMuc ON dbo.DanhMucDichVu(MaDanhMuc);

    -- Index tìm kiếm theo tên
    CREATE INDEX IX_DanhMucDichVu_TenDanhMuc ON dbo.DanhMucDichVu(TenDanhMuc);
END
GO

INSERT INTO dbo.DanhMucDichVu (MaDanhMuc, TenDanhMuc, MoTa, ThuTu)
VALUES
(N'DM01', N'Massage', N'Các gói massage', 1),
(N'DM02', N'Chăm sóc da', N'Facial, skin care', 2),
(N'DM03', N'Triệt lông', N'Các gói triệt lông', 3);
GO
IF OBJECT_ID('dbo.DichVu', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DichVu
    (
        Id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DichVu PRIMARY KEY,

        -- Liên kết danh mục
        DanhMucId        INT NULL,

        -- Thông tin cơ bản
        MaDichVu         NVARCHAR(50)  NOT NULL,              -- code dịch vụ (DV001...)
        TenDichVu        NVARCHAR(200) NOT NULL,
        MoTaNgan         NVARCHAR(500) NULL,
        MoTa             NVARCHAR(MAX) NULL,                 -- mô tả chi tiết
        LieuTrinh        NVARCHAR(MAX) NULL,                 -- các bước/ liệu trình
        GhiChuNoiBo      NVARCHAR(1000) NULL,                -- note nội bộ (không hiển thị)

        -- Giá
        GiaHienTai       DECIMAL(18,2) NOT NULL CONSTRAINT DF_DichVu_GiaHienTai DEFAULT(0), -- giá bán
        GiaGoc           DECIMAL(18,2) NULL,                 -- giá niêm yết trước giảm
        PhanTramGiam     DECIMAL(5,2)  NULL,                 -- % giảm (tùy chọn)
        ApDungTu         DATETIME2(0)  NULL,                 -- thời gian áp dụng giá
        ApDungDen        DATETIME2(0)  NULL,

        -- Thời lượng / liệu trình theo buổi
        ThoiLuongPhut    INT NOT NULL CONSTRAINT DF_DichVu_ThoiLuong DEFAULT(0), -- phút/buổi
        SoBuoi           INT NULL,                           -- gói bao nhiêu buổi (vd: 10)
        ThoiGianHieuLucNgay INT NULL,                        -- gói dùng trong bao nhiêu ngày

        -- Bán hàng / vận hành
        SKU              NVARCHAR(50) NULL,                  -- mã nội bộ
        Barcode          NVARCHAR(50) NULL,                  -- nếu có
        IsCombo          BIT NOT NULL CONSTRAINT DF_DichVu_IsCombo DEFAULT(0),   -- combo/gói
        IsOnlineVisible  BIT NOT NULL CONSTRAINT DF_DichVu_IsOnlineVisible DEFAULT(1), -- hiển thị trên app/web
        IsActive         BIT NOT NULL CONSTRAINT DF_DichVu_IsActive DEFAULT(1), -- còn kinh doanh
        ThuTuHienThi     INT NOT NULL CONSTRAINT DF_DichVu_ThuTu DEFAULT(0),

        -- Hình ảnh
        HinhAnhChinh     NVARCHAR(500) NULL,                 -- url/path ảnh chính
        HinhAnhJson      NVARCHAR(MAX) NULL,                 -- JSON list ảnh: ["url1","url2",...]

        -- SEO cơ bản (nếu bạn có web)
        Slug             NVARCHAR(250) NULL,                 -- /dich-vu/goi-dau-duong-sinh
        MetaTitle        NVARCHAR(250) NULL,
        MetaDescription  NVARCHAR(500) NULL,

        -- Audit
        CreatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_DichVu_CreatedAt DEFAULT(SYSDATETIME()),
        UpdatedAt        DATETIME2(0) NULL,
        CreatedBy        NVARCHAR(128) NULL,
        UpdatedBy        NVARCHAR(128) NULL
    );

    -- Unique / Index
    CREATE UNIQUE INDEX UX_DichVu_MaDichVu ON dbo.DichVu(MaDichVu);
    CREATE INDEX IX_DichVu_TenDichVu ON dbo.DichVu(TenDichVu);
    CREATE INDEX IX_DichVu_DanhMucId ON dbo.DichVu(DanhMucId);
    CREATE INDEX IX_DichVu_IsActive_Visible ON dbo.DichVu(IsActive, IsOnlineVisible);

    -- Constraints
    ALTER TABLE dbo.DichVu
      ADD CONSTRAINT CK_DichVu_GiaHienTai CHECK (GiaHienTai >= 0);

    ALTER TABLE dbo.DichVu
      ADD CONSTRAINT CK_DichVu_GiaGoc CHECK (GiaGoc IS NULL OR GiaGoc >= 0);

    -- GiaGoc (giá niêm yết) nên >= GiaHienTai
    ALTER TABLE dbo.DichVu
      ADD CONSTRAINT CK_DichVu_GiaGoc_GTE_GiaHienTai
      CHECK (GiaGoc IS NULL OR GiaGoc >= GiaHienTai);

    ALTER TABLE dbo.DichVu
      ADD CONSTRAINT CK_DichVu_PhanTramGiam
      CHECK (PhanTramGiam IS NULL OR (PhanTramGiam >= 0 AND PhanTramGiam <= 100));

    ALTER TABLE dbo.DichVu
      ADD CONSTRAINT CK_DichVu_ThoiLuong CHECK (ThoiLuongPhut >= 0);

    ALTER TABLE dbo.DichVu
      ADD CONSTRAINT CK_DichVu_SoBuoi CHECK (SoBuoi IS NULL OR SoBuoi > 0);

    ALTER TABLE dbo.DichVu
      ADD CONSTRAINT CK_DichVu_HieuLuc CHECK (ThoiGianHieuLucNgay IS NULL OR ThoiGianHieuLucNgay > 0);

    -- FK tới DanhMucDichVu (nếu có bảng)
    IF OBJECT_ID('dbo.DanhMucDichVu', 'U') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.DichVu
          ADD CONSTRAINT FK_DichVu_DanhMucDichVu
          FOREIGN KEY (DanhMucId) REFERENCES dbo.DanhMucDichVu(Id);
    END
END
GO
