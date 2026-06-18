using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spa.API.Data;
using Spa.API.Security;

namespace Spa.API.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = AppRoles.Admin)]
public class DashboardController : ControllerBase
{
    private const string ST_CANCELLED = "Hủy";
    private const string ST_PENDING = "Chờ xác nhận";
    private const string ST_CONFIRMED = "Đã xác nhận";
    private const string ST_DONE = "Hoàn thành";

    private readonly AppDbContext _db;
    public DashboardController(AppDbContext db) => _db = db;

    // GET: /api/admin/dashboard/stats
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var startOfMonth = new DateOnly(today.Year, today.Month, 1);
        var weekStart = today.AddDays(-6);    // 7 ngày tính cả hôm nay
        var yesterday = today.AddDays(-1);
        var dayBeforeYesterday = today.AddDays(-2);

        // ---- Lấy lịch hẹn trong tháng (kèm giá dịch vụ qua join) — dùng cho hôm nay, tuần, tháng, top dịch vụ
        // Để giảm số query, kéo về một tập đủ dùng (tháng này + 6 ngày trước nếu tháng vừa sang).
        var rangeFrom = startOfMonth < weekStart ? startOfMonth : weekStart;

        var inRange = await (
            from lh in _db.LichHens.AsNoTracking()
            join dv in _db.DichVus.AsNoTracking() on lh.DichVuId equals dv.Id into gj
            from dv in gj.DefaultIfEmpty()
            where lh.NgayHen >= rangeFrom && lh.NgayHen <= today
            select new
            {
                lh.Id,
                lh.NgayHen,
                lh.GioHen,
                lh.TrangThai,
                lh.DichVuId,
                lh.HoTenKhach,
                lh.DienThoaiKhach,
                TenDichVu = dv != null ? dv.TenDichVu : null,
                Gia = dv != null ? dv.GiaHienTai : 0m,
                lh.CreatedAt,
            }
        ).ToListAsync();

        bool IsRevenue(string? s) => s == ST_DONE; // chỉ lịch Hoàn thành mới tính doanh thu

        decimal RevenueOn(DateOnly d) =>
            inRange.Where(x => x.NgayHen == d && IsRevenue(x.TrangThai)).Sum(x => x.Gia);

        int BookingsOn(DateOnly d) =>
            inRange.Count(x => x.NgayHen == d);

        // Today / yesterday
        var todayRevenue = RevenueOn(today);
        var yesterdayRevenue = RevenueOn(yesterday);
        var todayBookings = BookingsOn(today);
        var yesterdayBookings = BookingsOn(yesterday);
        var dayBeforeYesterdayBookings = BookingsOn(dayBeforeYesterday);

        var todayPending = inRange.Count(x => x.NgayHen == today && x.TrangThai == ST_PENDING);
        var todayConfirmed = inRange.Count(x => x.NgayHen == today && x.TrangThai == ST_CONFIRMED);

        // Tháng này
        var monthRevenue = inRange
            .Where(x => x.NgayHen >= startOfMonth && IsRevenue(x.TrangThai))
            .Sum(x => x.Gia);
        var monthBookings = inRange.Count(x => x.NgayHen >= startOfMonth);

        // 7 ngày gần nhất (oldest → newest)
        var weeklyLabels = new List<string>(7);
        var weeklyRevenue = new List<decimal>(7);
        var weeklyBookings = new List<int>(7);
        for (var i = 0; i < 7; i++)
        {
            var d = weekStart.AddDays(i);
            weeklyLabels.Add(d.ToString("yyyy-MM-dd"));
            weeklyRevenue.Add(RevenueOn(d));
            weeklyBookings.Add(BookingsOn(d));
        }

        // Top dịch vụ trong tháng (theo doanh thu)
        var topServices = inRange
            .Where(x => x.NgayHen >= startOfMonth && IsRevenue(x.TrangThai) && x.DichVuId != 0)
            .GroupBy(x => new { x.DichVuId, Name = x.TenDichVu ?? $"#{x.DichVuId}" })
            .Select(g => new
            {
                id = g.Key.DichVuId,
                tenDichVu = g.Key.Name,
                count = g.Count(),
                revenue = g.Sum(x => x.Gia),
            })
            .OrderByDescending(x => x.revenue)
            .ThenByDescending(x => x.count)
            .Take(5)
            .ToList();

        // ---- Các totals khác
        var totalActiveServices = await _db.DichVus.AsNoTracking()
            .CountAsync(x => x.IsActive);

        var totalPendingBookings = await _db.LichHens.AsNoTracking()
            .CountAsync(x => x.TrangThai == ST_PENDING);

        var totalUnreadContacts = await _db.LienHes.AsNoTracking()
            .CountAsync(x => !x.DaXem);

        var totalPublishedPosts = await _db.BaiViets.AsNoTracking()
            .CountAsync(x => x.IsPublished);

        // Tin nhắn mới trong 24h
        var since24h = DateTime.Now.AddHours(-24);
        var newContacts24h = await _db.LienHes.AsNoTracking()
            .CountAsync(x => x.CreatedAt >= since24h);

        // ---- Lịch hẹn gần đây (10 cái mới tạo nhất)
        var recentBookings = await (
            from lh in _db.LichHens.AsNoTracking()
            join dv in _db.DichVus.AsNoTracking() on lh.DichVuId equals dv.Id into gj
            from dv in gj.DefaultIfEmpty()
            orderby lh.CreatedAt descending
            select new
            {
                lh.Id,
                lh.HoTenKhach,
                lh.DienThoaiKhach,
                lh.NgayHen,
                lh.GioHen,
                lh.TrangThai,
                lh.DichVuId,
                tenDichVu = dv != null ? dv.TenDichVu : null,
                gia = dv != null ? dv.GiaHienTai : 0m,
            }
        ).Take(10).ToListAsync();

        return Ok(new
        {
            asOf = DateTime.Now,
            today = new
            {
                revenue = todayRevenue,
                bookings = todayBookings,
                pending = todayPending,
                confirmed = todayConfirmed,
                newContacts24h,
                revenueChangePct = PctChange(yesterdayRevenue, todayRevenue),
                bookingsChangeAbs = todayBookings - yesterdayBookings,
            },
            yesterday = new
            {
                revenue = yesterdayRevenue,
                bookings = yesterdayBookings,
            },
            month = new
            {
                revenue = monthRevenue,
                bookings = monthBookings,
            },
            totals = new
            {
                activeServices = totalActiveServices,
                pendingBookings = totalPendingBookings,
                unreadContacts = totalUnreadContacts,
                publishedPosts = totalPublishedPosts,
            },
            weekly = new
            {
                labels = weeklyLabels,
                revenue = weeklyRevenue,
                bookings = weeklyBookings,
            },
            // Một số gợi ý so sánh ngắn
            comparisons = new
            {
                bookingsTodayVsYesterday = todayBookings - yesterdayBookings,
                bookingsYesterdayVsDayBefore = yesterdayBookings - dayBeforeYesterdayBookings,
            },
            topServices,
            recentBookings,
        });
    }

    private static double? PctChange(decimal prev, decimal cur)
    {
        if (prev == 0m) return cur > 0m ? 100d : (double?)null;
        return (double)((cur - prev) / prev) * 100d;
    }
}
