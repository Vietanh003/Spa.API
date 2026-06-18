import { Link } from "react-router-dom";
import { useCustomerCartStore } from "../store/cart";
import { formatVnd } from "../lib/format";

export default function CustomerCart() {
  const items = useCustomerCartStore((s) => s.items);
  const remove = useCustomerCartStore((s) => s.remove);
  const setQty = useCustomerCartStore((s) => s.setQty);
  const clear = useCustomerCartStore((s) => s.clear);
  const total = useCustomerCartStore((s) => s.totalAmount());

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Giỏ hàng</h1>
          <p className="mt-1 text-sm text-slate-600">Các dịch vụ bạn muốn đặt</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clear}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
            disabled={items.length === 0}
          >
            Xóa tất cả
          </button>
          <Link
            to="/booking"
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Đặt lịch
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-600">Giỏ hàng trống.</div>
        ) : (
          <div className="divide-y">
            {items.map((x) => (
              <div key={x.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{x.tenDichVu}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {x.danhMucTen ?? "Dịch vụ"}
                    {x.thoiLuongPhut != null ? ` • ${x.thoiLuongPhut} phút` : ""}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold">{formatVnd(x.giaHienTai ?? 0)}</div>

                  <input
                    type="number"
                    min={1}
                    className="w-20 rounded-xl border px-3 py-2 text-sm"
                    value={x.qty}
                    onChange={(e) => setQty(x.id, Number(e.target.value))}
                  />

                  <button
                    className="rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
                    onClick={() => remove(x.id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">Tổng</div>
          <div className="text-lg font-semibold">{formatVnd(total)}</div>
        </div>
      </div>
    </div>
  );
}
