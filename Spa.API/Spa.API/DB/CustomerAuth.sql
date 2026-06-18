-- SQL Server
IF OBJECT_ID('dbo.KhachHang', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.KhachHang (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        HoTen NVARCHAR(200) NOT NULL,
        Email NVARCHAR(100) NOT NULL,
        GoogleSubject NVARCHAR(128) NULL,
        AvatarUrl NVARCHAR(500) NULL,
        EmailVerified BIT NOT NULL CONSTRAINT DF_KhachHang_EmailVerified DEFAULT 0,
        IsActive BIT NOT NULL CONSTRAINT DF_KhachHang_IsActive DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_KhachHang_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_KhachHang_UpdatedAt DEFAULT SYSUTCDATETIME()
    );

    CREATE UNIQUE INDEX UX_KhachHang_Email ON dbo.KhachHang(Email);
    CREATE UNIQUE INDEX UX_KhachHang_GoogleSubject ON dbo.KhachHang(GoogleSubject) WHERE GoogleSubject IS NOT NULL;
END;

IF OBJECT_ID('dbo.EmailVerificationCode', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EmailVerificationCode (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Email NVARCHAR(100) NOT NULL,
        CodeHash NVARCHAR(128) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_EmailVerificationCode_CreatedAt DEFAULT SYSUTCDATETIME(),
        UsedAt DATETIME2 NULL
    );

    CREATE INDEX IX_EmailVerificationCode_Email_CreatedAt ON dbo.EmailVerificationCode(Email, CreatedAt);
END;
