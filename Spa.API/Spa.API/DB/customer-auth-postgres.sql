-- KhachHang
IF NOT EXISTS (
    SELECT * 
    FROM sys.tables 
    WHERE name = 'KhachHang'
)
BEGIN
    CREATE TABLE KhachHang (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        HoTen NVARCHAR(200) NOT NULL,
        Email VARCHAR(100) NOT NULL,
        GoogleSubject VARCHAR(128) NULL,
        AvatarUrl VARCHAR(500) NULL,
        EmailVerified BIT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- Unique Index Email
IF NOT EXISTS (
    SELECT * 
    FROM sys.indexes 
    WHERE name = 'UX_KhachHang_Email'
)
BEGIN
    CREATE UNIQUE INDEX UX_KhachHang_Email
    ON KhachHang (Email);
END
GO

-- Unique Index GoogleSubject (chỉ khi khác NULL)
IF NOT EXISTS (
    SELECT * 
    FROM sys.indexes 
    WHERE name = 'UX_KhachHang_GoogleSubject'
)
BEGIN
    CREATE UNIQUE INDEX UX_KhachHang_GoogleSubject
    ON KhachHang (GoogleSubject)
    WHERE GoogleSubject IS NOT NULL;
END
GO

-- EmailVerificationCode
IF NOT EXISTS (
    SELECT * 
    FROM sys.tables 
    WHERE name = 'EmailVerificationCode'
)
BEGIN
    CREATE TABLE EmailVerificationCode (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Email VARCHAR(100) NOT NULL,
        CodeHash VARCHAR(128) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UsedAt DATETIME2 NULL
    );
END
GO

-- Index Email + CreatedAt
IF NOT EXISTS (
    SELECT * 
    FROM sys.indexes 
    WHERE name = 'IX_EmailVerificationCode_Email_CreatedAt'
)
BEGIN
    CREATE INDEX IX_EmailVerificationCode_Email_CreatedAt
    ON EmailVerificationCode (Email, CreatedAt);
END
GO