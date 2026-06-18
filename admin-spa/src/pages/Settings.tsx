export default function Settings() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="bg-white border rounded-xl p-4 space-y-3 max-w-xl">
        <label className="block text-sm">
          Spa name
          <input className="mt-1 w-full border rounded-md px-3 py-2" defaultValue="VietAnh Spa" />
        </label>

        <label className="block text-sm">
          Hotline
          <input className="mt-1 w-full border rounded-md px-3 py-2" defaultValue="0909 000 000" />
        </label>

        <button className="text-sm px-3 py-2 rounded-md bg-slate-900 text-white">
          Save
        </button>
      </div>
    </div>
  );
}
