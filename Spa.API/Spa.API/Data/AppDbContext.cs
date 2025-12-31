using Microsoft.EntityFrameworkCore;
using Spa.API.Entities; 

namespace Spa.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<NhanVien> NhanViens => Set<NhanVien>();
        public DbSet<DichVu> DichVus => Set<DichVu>();
        public DbSet<DanhMucDichVu> DanhMucDichVus => Set<DanhMucDichVu>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder); 

            var e = modelBuilder.Entity<NhanVien>();
            e.ToTable("NhanVien", "dbo");
            e.HasKey(x => x.Id);

            e.Property(x => x.HoTen).HasMaxLength(200).IsRequired();
            e.Property(x => x.GioiTinh).HasMaxLength(5).IsRequired();
            e.Property(x => x.DienThoai).HasMaxLength(20).IsRequired();
            e.Property(x => x.DiaChi).HasMaxLength(200);
            e.Property(x => x.ChucVu).HasMaxLength(50).IsRequired();
            e.Property(x => x.DbLoginName).HasMaxLength(128).IsRequired();
            e.HasIndex(x => x.DbLoginName).IsUnique();
            // map đúng kiểu varbinary
            e.Property(x => x.PasswordSalt).HasColumnType("varbinary(16)");
            e.Property(x => x.PasswordHashSha).HasColumnType("varbinary(32)");

            var dm = modelBuilder.Entity<DanhMucDichVu>();
            dm.ToTable("DanhMucDichVu", "dbo");
            dm.HasKey(x => x.Id);

            dm.Property(x => x.MaDanhMuc).HasMaxLength(50).IsRequired();
            dm.Property(x => x.TenDanhMuc).HasMaxLength(200).IsRequired();
            dm.Property(x => x.MoTa).HasMaxLength(1000);

            dm.HasIndex(x => x.MaDanhMuc).IsUnique();
            dm.HasIndex(x => x.TenDanhMuc);

            var dv = modelBuilder.Entity<DichVu>();
            dv.ToTable("DichVu", "dbo");
            dv.HasKey(x => x.Id);

            dv.Property(x => x.MaDichVu).HasMaxLength(50).IsRequired();
            dv.Property(x => x.TenDichVu).HasMaxLength(200).IsRequired();
            dv.Property(x => x.MoTaNgan).HasMaxLength(500);
            dv.Property(x => x.GhiChuNoiBo).HasMaxLength(1000);

            dv.Property(x => x.GiaHienTai).HasColumnType("decimal(18,2)");
            dv.Property(x => x.GiaGoc).HasColumnType("decimal(18,2)");
            dv.Property(x => x.PhanTramGiam).HasColumnType("decimal(5,2)");

            dv.Property(x => x.HinhAnhChinh).HasMaxLength(500);

            dv.Property(x => x.SKU).HasMaxLength(50);
            dv.Property(x => x.Barcode).HasMaxLength(50);

            dv.Property(x => x.Slug).HasMaxLength(250);
            dv.Property(x => x.MetaTitle).HasMaxLength(250);
            dv.Property(x => x.MetaDescription).HasMaxLength(500);

            dv.Property(x => x.CreatedBy).HasMaxLength(128);
            dv.Property(x => x.UpdatedBy).HasMaxLength(128);

            dv.HasIndex(x => x.MaDichVu).IsUnique();
            dv.HasIndex(x => x.TenDichVu);
            dv.HasIndex(x => x.DanhMucId);
            dv.HasIndex(x => new { x.IsActive, x.IsOnlineVisible });

            dm.HasMany(x => x.DichVus)
            .WithOne(x => x.DanhMucDichVu)
            .HasForeignKey(x => x.DanhMucId)
            .OnDelete(DeleteBehavior.Restrict);
        }

    }
}
