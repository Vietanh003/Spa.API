const mock = [
  { id: 1, name: "Nguyễn Văn A", role: "Admin" },
  { id: 2, name: "Trần Thị B", role: "Staff" },
  { id: 3, name: "Lê Văn C", role: "Staff" },
];

export default function Users() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Users</h1>
        <button className="text-sm px-3 py-2 rounded-md bg-slate-900 text-white">
          + Add user
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Role</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mock.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.id}</td>
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3 text-right">
                  <button className="px-2 py-1 rounded border hover:bg-slate-50">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
