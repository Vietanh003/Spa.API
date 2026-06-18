-- Tạo bảng LienHe (chứa tin nhắn liên hệ từ khách hàng)
IF NOT EXISTS (SELECT 1 FROM sys.tables t
               JOIN sys.schemas s ON s.schema_id = t.schema_id
               WHERE s.name = 'dbo' AND t.name = 'LienHe')
BEGIN
    CREATE TABLE [dbo].[LienHe] (
        [Id]          INT IDENTITY(1,1) NOT NULL,
        [HoTen]       NVARCHAR(200) NOT NULL,
        [DienThoai]   NVARCHAR(20)  NOT NULL,
        [Email]       NVARCHAR(100) NULL,
        [LoiNhan]     NVARCHAR(2000) NOT NULL,
        [CreatedAt]   DATETIME2(7)  NOT NULL CONSTRAINT [DF_LienHe_CreatedAt] DEFAULT (SYSDATETIME()),
        [DaXem]       BIT           NOT NULL CONSTRAINT [DF_LienHe_DaXem]     DEFAULT (0),
        [XemLuc]      DATETIME2(7)  NULL,
        [XemBoi]      NVARCHAR(128) NULL,
        CONSTRAINT [PK_LienHe] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    CREATE INDEX [IX_LienHe_DaXem]     ON [dbo].[LienHe]([DaXem]);
    CREATE INDEX [IX_LienHe_CreatedAt] ON [dbo].[LienHe]([CreatedAt] DESC);
END
GO
