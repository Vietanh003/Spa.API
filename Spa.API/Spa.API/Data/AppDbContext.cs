using Microsoft.EntityFrameworkCore;
using Spa.API.Entities; 

namespace Spa.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<NhanVien> NhanViens => Set<NhanVien>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
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

            base.OnModelCreating(modelBuilder);
        }
    }
}
