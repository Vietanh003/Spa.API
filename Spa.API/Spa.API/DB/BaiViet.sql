-- Tạo bảng BaiViet (bài blog)
IF NOT EXISTS (SELECT 1 FROM sys.tables t
               JOIN sys.schemas s ON s.schema_id = t.schema_id
               WHERE s.name = 'dbo' AND t.name = 'BaiViet')
BEGIN
    CREATE TABLE [dbo].[BaiViet] (
        [Id]               INT IDENTITY(1,1)  NOT NULL,
        [Slug]             NVARCHAR(250)      NOT NULL,
        [TieuDe]           NVARCHAR(250)      NOT NULL,
        [MoTaNgan]         NVARCHAR(500)      NULL,
        [NoiDung]          NVARCHAR(MAX)      NULL,
        [DanhMuc]          NVARCHAR(100)      NULL,
        [AnhBia]           NVARCHAR(500)      NULL,
        [VideoUrl]         NVARCHAR(500)      NULL,
        [TacGia]           NVARCHAR(100)      NULL,
        [ThoiGianDocPhut]  INT                NULL,
        [IsPublished]      BIT                NOT NULL CONSTRAINT [DF_BaiViet_IsPublished] DEFAULT (0),
        [NgayDang]         DATETIME2(7)       NULL,
        [CreatedAt]        DATETIME2(7)       NOT NULL CONSTRAINT [DF_BaiViet_CreatedAt] DEFAULT (SYSDATETIME()),
        [UpdatedAt]        DATETIME2(7)       NULL,
        [CreatedBy]        NVARCHAR(128)      NULL,
        [UpdatedBy]        NVARCHAR(128)      NULL,
        CONSTRAINT [PK_BaiViet] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_BaiViet_Slug] UNIQUE ([Slug])
    );

    CREATE INDEX [IX_BaiViet_IsPublished] ON [dbo].[BaiViet]([IsPublished]);
    CREATE INDEX [IX_BaiViet_NgayDang]    ON [dbo].[BaiViet]([NgayDang] DESC);
END
GO
