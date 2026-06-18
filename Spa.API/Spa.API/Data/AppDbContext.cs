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
        public DbSet<LichHen> LichHens => Set<LichHen>();
        public DbSet<LienHe> LienHes => Set<LienHe>();
        public DbSet<BaiViet> BaiViets => Set<BaiViet>();
        public DbSet<KhachHang> KhachHangs => Set<KhachHang>();
        public DbSet<EmailVerificationCode> EmailVerificationCodes => Set<EmailVerificationCode>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ===== NhanVien =====
            var e = modelBuilder.Entity<NhanVien>();

            e.ToTable("NhanVien", tb =>
            {
                tb.HasTrigger("TR_NhanVien");
            });

            e.HasKey(x => x.Id);

            e.Property(x => x.HoTen).HasMaxLength(200).IsRequired();
            e.Property(x => x.GioiTinh).HasMaxLength(5).IsRequired();
            e.Property(x => x.DienThoai).HasMaxLength(20).IsRequired();
            e.Property(x => x.DiaChi).HasMaxLength(200);
            e.Property(x => x.ChucVu).HasMaxLength(50).IsRequired();
            e.Property(x => x.DbLoginName).HasMaxLength(128).IsRequired();

            e.HasIndex(x => x.DbLoginName).IsUnique();
            // Npgsql tự dùng "bytea" cho byte[] — không cần HasColumnType.

            // ===== DanhMucDichVu =====
            var dm = modelBuilder.Entity<DanhMucDichVu>();
            dm.ToTable("DanhMucDichVu");
            dm.HasKey(x => x.Id);

            dm.Property(x => x.MaDanhMuc).HasMaxLength(50).IsRequired();
            dm.Property(x => x.TenDanhMuc).HasMaxLength(200).IsRequired();
            dm.Property(x => x.MoTa).HasMaxLength(1000);

            dm.HasIndex(x => x.MaDanhMuc).IsUnique();
            dm.HasIndex(x => x.TenDanhMuc);

            // ===== DichVu =====
            var dv = modelBuilder.Entity<DichVu>();
            dv.ToTable("DichVu");
            dv.HasKey(x => x.Id);

            dv.Property(x => x.MaDichVu).HasMaxLength(50).IsRequired();
            dv.Property(x => x.TenDichVu).HasMaxLength(200).IsRequired();
            dv.Property(x => x.MoTaNgan).HasMaxLength(500);
            dv.Property(x => x.GhiChuNoiBo).HasMaxLength(1000);

            dv.Property(x => x.GiaHienTai).HasPrecision(18, 2);
            dv.Property(x => x.GiaGoc).HasPrecision(18, 2);
            dv.Property(x => x.PhanTramGiam).HasPrecision(5, 2);

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

            // ===== LichHen =====
            // Npgsql tự map DateOnly -> "date", TimeOnly -> "time without time zone".
            var lh = modelBuilder.Entity<LichHen>();
            lh.ToTable("LichHen");
            lh.HasKey(x => x.Id);

            lh.Property(x => x.HoTenKhach).HasMaxLength(200).IsRequired();
            lh.Property(x => x.DienThoaiKhach).HasMaxLength(20).IsRequired();
            lh.Property(x => x.EmailKhach).HasMaxLength(100);
            lh.HasIndex(x => x.KhachHangId);

            lh.Property(x => x.GhiChuKhach).HasMaxLength(500);
            lh.Property(x => x.GhiChuNoiBo).HasMaxLength(1000);
            lh.Property(x => x.TrangThai).HasMaxLength(50).IsRequired();
            lh.Property(x => x.LyDoHuy).HasMaxLength(500);

            lh.Property(x => x.CreatedBy).HasMaxLength(128);
            lh.Property(x => x.UpdatedBy).HasMaxLength(128);

            lh.HasOne(x => x.DichVu)
              .WithMany()
              .HasForeignKey(x => x.DichVuId)
              .OnDelete(DeleteBehavior.Restrict);

            lh.HasOne(x => x.KhachHang)
              .WithMany()
              .HasForeignKey(x => x.KhachHangId)
              .OnDelete(DeleteBehavior.SetNull);

            // ===== LienHe =====
            var lhe = modelBuilder.Entity<LienHe>();
            lhe.ToTable("LienHe");
            lhe.HasKey(x => x.Id);
            lhe.Property(x => x.HoTen).HasMaxLength(200).IsRequired();
            lhe.Property(x => x.DienThoai).HasMaxLength(20).IsRequired();
            lhe.Property(x => x.Email).HasMaxLength(100);
            lhe.Property(x => x.LoiNhan).HasMaxLength(2000).IsRequired();
            lhe.Property(x => x.XemBoi).HasMaxLength(128);
            lhe.HasIndex(x => x.DaXem);
            lhe.HasIndex(x => x.CreatedAt);

            // ===== BaiViet =====
            var bv = modelBuilder.Entity<BaiViet>();
            bv.ToTable("BaiViet");
            bv.HasKey(x => x.Id);
            bv.Property(x => x.Slug).HasMaxLength(250).IsRequired();
            bv.Property(x => x.TieuDe).HasMaxLength(250).IsRequired();
            bv.Property(x => x.MoTaNgan).HasMaxLength(500);
            // Không set HasMaxLength cho NoiDung → Npgsql map sang "text" (unlimited).
            bv.Property(x => x.DanhMuc).HasMaxLength(100);
            bv.Property(x => x.AnhBia).HasMaxLength(500);
            bv.Property(x => x.VideoUrl).HasMaxLength(500);
            bv.Property(x => x.TacGia).HasMaxLength(100);
            bv.Property(x => x.CreatedBy).HasMaxLength(128);
            bv.Property(x => x.UpdatedBy).HasMaxLength(128);
            bv.HasIndex(x => x.Slug).IsUnique();
            bv.HasIndex(x => x.IsPublished);
            bv.HasIndex(x => x.NgayDang);

            // ===== KhachHang =====
            var kh = modelBuilder.Entity<KhachHang>();
            kh.ToTable("KhachHang");
            kh.HasKey(x => x.Id);
            kh.Property(x => x.HoTen).HasMaxLength(200).IsRequired();
            kh.Property(x => x.Email).HasMaxLength(100).IsRequired();
            kh.Property(x => x.GoogleSubject).HasMaxLength(128);
            kh.Property(x => x.AvatarUrl).HasMaxLength(500);
            kh.HasIndex(x => x.Email).IsUnique();
            kh.HasIndex(x => x.GoogleSubject).IsUnique();

            // ===== EmailVerificationCode =====
            var evc = modelBuilder.Entity<EmailVerificationCode>();
            evc.ToTable("EmailVerificationCode");
            evc.HasKey(x => x.Id);
            evc.Property(x => x.Email).HasMaxLength(100).IsRequired();
            evc.Property(x => x.CodeHash).HasMaxLength(128).IsRequired();
            evc.HasIndex(x => new { x.Email, x.CreatedAt });
        }
    }
}
