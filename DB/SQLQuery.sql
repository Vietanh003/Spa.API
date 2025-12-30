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