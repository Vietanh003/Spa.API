import { create } from "zustand";

export type CustomerCartItem = {
  id: number;
  tenDichVu: string;
  giaHienTai: number;
  thoiLuongPhut?: number | null;
  danhMucTen?: string | null;
  qty: number;
};

type CustomerCartState = {
  items: CustomerCartItem[];

  add: (item: Omit<CustomerCartItem, "qty">, qty?: number) => void;
  remove: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;

  totalQty: () => number;
  totalAmount: () => number;
};

const LS_KEY = "customer_cart";

function readStorage(): CustomerCartItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.id === "number" && typeof x.tenDichVu === "string")
      .map((x) => ({
        id: Number(x.id),
        tenDichVu: String(x.tenDichVu),
        giaHienTai: Number(x.giaHienTai ?? 0),
        thoiLuongPhut: x.thoiLuongPhut == null ? null : Number(x.thoiLuongPhut),
        danhMucTen: x.danhMucTen == null ? null : String(x.danhMucTen),
        qty: Math.max(1, Number(x.qty ?? 1)),
      }));
  } catch {
    return [];
  }
}

function writeStorage(items: CustomerCartItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const useCustomerCartStore = create<CustomerCartState>((set, get) => ({
  items: readStorage(),

  add: (item, qty = 1) => {
    const q = Math.max(1, Number(qty || 1));
    set((s) => {
      const idx = s.items.findIndex((x) => x.id === item.id);
      const next = [...s.items];
      if (idx >= 0) {
        next[idx] = { ...next[idx], qty: next[idx].qty + q };
      } else {
        next.unshift({ ...item, qty: q });
      }
      writeStorage(next);
      return { items: next };
    });
  },

  remove: (id) => {
    set((s) => {
      const next = s.items.filter((x) => x.id !== id);
      writeStorage(next);
      return { items: next };
    });
  },

  setQty: (id, qty) => {
    const q = Math.max(1, Number(qty || 1));
    set((s) => {
      const next = s.items.map((x) => (x.id === id ? { ...x, qty: q } : x));
      writeStorage(next);
      return { items: next };
    });
  },

  clear: () => {
    writeStorage([]);
    set({ items: [] });
  },

  totalQty: () => get().items.reduce((sum, x) => sum + (x.qty || 0), 0),
  totalAmount: () => get().items.reduce((sum, x) => sum + (x.qty || 0) * (x.giaHienTai || 0), 0),
}));
