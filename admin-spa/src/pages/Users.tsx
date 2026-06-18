import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, LockKeyhole, Pencil, Plus, RefreshCw, Save, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { usersApi, type AdminUserRow, type CreateAdminUserPayload, type UserRole } from "../api/users";

type Mode = "create" | "edit";

const roleLabels: Record<UserRole, string> = {
  Admin: "Quan tri he thong",
  ContentManager: "Quan ly noi dung",
  ServiceManager: "Quan ly dich vu",
  Receptionist: "Le tan",
};

const roleDescriptions: Record<UserRole, string> = {
  Admin: "Toan quyen tao tai khoan, phan quyen va quan tri du lieu.",
  ContentManager: "Quan ly blog, bai viet va noi dung hien thi.",
  ServiceManager: "Quan ly danh muc, dich vu, gia va trang thai hien thi.",
  Receptionist: "Xu ly lich hen, tin nhan lien he va thong tin khach.",
};

const defaultRoles: UserRole[] = ["Admin", "ContentManager", "ServiceManager", "Receptionist"];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getErrorText(error: unknown, fallback: string) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown; response?: { data?: unknown } };
    const data = maybe.response?.data;
    if (typeof data === "string") return data;
    if (data != null) return JSON.stringify(data);
    if (typeof maybe.message === "string") return maybe.message;
  }
  return fallback;
}

function emptyForm(): CreateAdminUserPayload {
  return {
    hoTen: "",
    gioiTinh: "Khac",
    dienThoai: "",
    diaChi: "",
    dbLoginName: "",
    password: "",
    chucVu: "Receptionist",
    isActive: true,
  };
}

function RoleBadge({ role }: { role: UserRole }) {
  const tone =
    role === "Admin"
      ? "bg-slate-900 text-white ring-slate-900"
      : role === "ServiceManager"
        ? "bg-sky-50 text-sky-700 ring-sky-200"
        : role === "ContentManager"
          ? "bg-violet-50 text-violet-700 ring-violet-200"
          : "bg-emerald-50 text-emerald-700 ring-emerald-200";

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", tone)}>
      {roleLabels[role] ?? role}
    </span>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-4xl rounded-xl border bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserRound size={18} />
            {title}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Dong">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[82vh] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export default function Users() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [roles, setRoles] = useState<UserRole[]>(defaultRoles);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "locked">("all");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateAdminUserPayload>(() => emptyForm());

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [userRows, roleRows] = await Promise.all([usersApi.list(), usersApi.roles().catch(() => defaultRoles)]);
      setRows(userRows);
      setRoles(roleRows.length ? roleRows : defaultRoles);
    } catch (error: unknown) {
      setErr(getErrorText(error, "Khong tai duoc danh sach tai khoan."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesText =
        !keyword ||
        row.hoTen.toLowerCase().includes(keyword) ||
        row.dbLoginName.toLowerCase().includes(keyword) ||
        row.dienThoai.toLowerCase().includes(keyword);
      const matchesRole = roleFilter === "all" || row.chucVu === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && row.isActive) ||
        (statusFilter === "locked" && !row.isActive);
      return matchesText && matchesRole && matchesStatus;
    });
  }, [q, roleFilter, rows, statusFilter]);

  const activeCount = rows.filter((row) => row.isActive).length;
  const adminCount = rows.filter((row) => row.chucVu === "Admin").length;

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm());
    setErr(null);
    setOpen(true);
  }

  function openEdit(row: AdminUserRow) {
    setMode("edit");
    setEditingId(row.id);
    setForm({
      hoTen: row.hoTen,
      gioiTinh: row.gioiTinh,
      dienThoai: row.dienThoai,
      diaChi: row.diaChi ?? "",
      dbLoginName: row.dbLoginName,
      password: "",
      chucVu: row.chucVu,
      isActive: row.isActive,
    });
    setErr(null);
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  function patchForm<K extends keyof CreateAdminUserPayload>(key: K, value: CreateAdminUserPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setErr(null);

    const payload = {
      ...form,
      hoTen: form.hoTen.trim(),
      gioiTinh: form.gioiTinh.trim() || "Khac",
      dienThoai: form.dienThoai.trim(),
      diaChi: form.diaChi?.trim() ? form.diaChi.trim() : null,
      dbLoginName: form.dbLoginName.trim(),
      password: form.password,
    };

    if (!payload.hoTen) return setErr("Ho ten la bat buoc.");
    if (!payload.dienThoai) return setErr("Dien thoai la bat buoc.");
    if (mode === "create" && !payload.dbLoginName) return setErr("Ten dang nhap la bat buoc.");
    if (mode === "create" && payload.password.length < 6) return setErr("Mat khau toi thieu 6 ky tu.");

    setSaving(true);
    try {
      if (mode === "create") {
        await usersApi.create(payload);
      } else {
        if (!editingId) return;
        await usersApi.update(editingId, {
          hoTen: payload.hoTen,
          gioiTinh: payload.gioiTinh,
          dienThoai: payload.dienThoai,
          diaChi: payload.diaChi,
          chucVu: payload.chucVu,
          isActive: payload.isActive,
        });
      }
      setOpen(false);
      await load();
    } catch (error: unknown) {
      setErr(getErrorText(error, "Luu tai khoan that bai."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tai khoan va phan quyen</h1>
          <p className="mt-1 text-sm text-slate-600">Tao tai khoan nhan vien, gan vai tro va khoa/mo truy cap he thong.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus size={16} />
          Tao tai khoan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-white">
              <UserRound size={18} />
            </div>
            <div>
              <div className="text-2xl font-semibold">{rows.length}</div>
              <div className="text-sm text-slate-600">Tong tai khoan</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-2xl font-semibold">{activeCount}</div>
              <div className="text-sm text-slate-600">Dang hoat dong</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-700">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-2xl font-semibold">{adminCount}</div>
              <div className="text-sm text-slate-600">Quan tri vien</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_180px_auto]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl border px-9 py-2 text-sm"
              placeholder="Tim ho ten, ten dang nhap, dien thoai..."
            />
          </label>
          <select className="rounded-xl border px-3 py-2 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "all" | UserRole)}>
            <option value="all">Tat ca vai tro</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role] ?? role}
              </option>
            ))}
          </select>
          <select className="rounded-xl border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "locked")}>
            <option value="all">Tat ca trang thai</option>
            <option value="active">Dang hoat dong</option>
            <option value="locked">Da khoa</option>
          </select>
          <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50">
            <RefreshCw size={16} />
            Tai lai
          </button>
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold">Danh sach nhan vien</div>
          <div className="text-xs text-slate-500">Hien thi: {filtered.length}</div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nhan vien</th>
                <th className="px-4 py-3 font-medium">Dang nhap</th>
                <th className="px-4 py-3 font-medium">Vai tro</th>
                <th className="px-4 py-3 font-medium">Trang thai</th>
                <th className="px-4 py-3 text-right font-medium">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>Dang tai...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>Khong co du lieu</td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{row.hoTen}</div>
                      <div className="text-xs text-slate-500">{row.dienThoai}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.dbLoginName}</td>
                    <td className="px-4 py-3"><RoleBadge role={row.chucVu} /></td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", row.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200")}>
                        {row.isActive ? <CheckCircle2 size={13} /> : <LockKeyhole size={13} />}
                        {row.isActive ? "Dang hoat dong" : "Da khoa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => openEdit(row)} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
                        <Pencil size={15} />
                        Sua
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} title={mode === "create" ? "Tao tai khoan moi" : "Cap nhat tai khoan"} onClose={closeModal}>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block text-sm">
              Ho ten
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={form.hoTen} onChange={(e) => patchForm("hoTen", e.target.value)} placeholder="Nguyen Van A" />
            </label>
            <label className="block text-sm">
              Dien thoai
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={form.dienThoai} onChange={(e) => patchForm("dienThoai", e.target.value)} placeholder="0900000000" />
            </label>
            <label className="block text-sm">
              Gioi tinh
              <select className="mt-1 w-full rounded-xl border px-3 py-2" value={form.gioiTinh} onChange={(e) => patchForm("gioiTinh", e.target.value)}>
                <option value="Nam">Nam</option>
                <option value="Nu">Nu</option>
                <option value="Khac">Khac</option>
              </select>
            </label>
            <label className="block text-sm">
              Ten dang nhap
              <input className="mt-1 w-full rounded-xl border px-3 py-2 disabled:bg-slate-100" value={form.dbLoginName} onChange={(e) => patchForm("dbLoginName", e.target.value)} disabled={mode === "edit"} placeholder="nv001" />
            </label>
            {mode === "create" && (
              <label className="block text-sm md:col-span-2">
                Mat khau
                <input className="mt-1 w-full rounded-xl border px-3 py-2" type="password" value={form.password} onChange={(e) => patchForm("password", e.target.value)} placeholder="Toi thieu 6 ky tu" />
              </label>
            )}
            <label className="block text-sm md:col-span-2">
              Dia chi
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={form.diaChi ?? ""} onChange={(e) => patchForm("diaChi", e.target.value)} placeholder="Dia chi lien he" />
            </label>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck size={17} />
              Phan quyen truy cap
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {roles.map((role) => (
                <label key={role} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 ring-1 ring-transparent", form.chucVu === role && "border-slate-900 ring-slate-900")}>
                  <input type="radio" className="mt-1" checked={form.chucVu === role} onChange={() => patchForm("chucVu", role)} />
                  <span>
                    <span className="block text-sm font-semibold">{roleLabels[role] ?? role}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{roleDescriptions[role] ?? role}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => patchForm("isActive", e.target.checked)} />
            Cho phep dang nhap
          </label>

          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {err}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={closeModal} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50" disabled={saving}>
              Huy
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60">
              <Save size={16} />
              {saving ? "Dang luu..." : "Luu tai khoan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
