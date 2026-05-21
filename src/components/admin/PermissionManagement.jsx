import { useEffect, useState } from "react"
import api from "../../api/axiosInstance"
import { toast } from "react-toastify"

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]
const EMPTY_FORM = { name: "", apiPath: "", method: "GET", module: "" }

const PermissionManagement = () => {
    const [permissions, setPermissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState(EMPTY_FORM)
    const [editId, setEditId] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState("")

    const fetchPermissions = async () => {
        try {
            const res = await api.get("/admin/permissions")
            setPermissions(res.data)
        } catch { toast.error("Không thể tải danh sách quyền hạn") }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchPermissions() }, [])

    const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
    const openEdit = (p) => {
        setForm({ name: p.name, apiPath: p.apiPath, method: p.method, module: p.module })
        setEditId(p.id)
        setShowForm(true)
    }
    const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.apiPath.trim() || !form.module.trim()) {
            return toast.error("Vui lòng điền đầy đủ thông tin bắt buộc")
        }
        setSaving(true)
        try {
            if (editId) {
                await api.put(`/admin/permissions/${editId}`, form)
                toast.success("Cập nhật quyền hạn thành công")
            } else {
                await api.post("/admin/permissions", form)
                toast.success("Tạo quyền hạn thành công")
            }
            closeForm()
            fetchPermissions()
        } catch (err) { toast.error(err.message || "Thao tác thất bại") }
        finally { setSaving(false) }
    }

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Xoá quyền "${name}"?`)) return
        try {
            await api.delete(`/admin/permissions/${id}`)
            toast.success("Đã xoá quyền hạn")
            fetchPermissions()
        } catch (err) { toast.error(err.message || "Không thể xoá quyền này") }
    }

    const METHOD_COLOR = {
        GET: "bg-green-100 text-green-700",
        POST: "bg-blue-100 text-blue-700",
        PUT: "bg-amber-100 text-amber-700",
        PATCH: "bg-purple-100 text-purple-700",
        DELETE: "bg-red-100 text-red-700",
    }

    const filtered = permissions.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.apiPath?.toLowerCase().includes(search.toLowerCase()) ||
        p.module?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return (
        <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-900">Quản lý quyền hạn</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{permissions.length} quyền hạn trong hệ thống</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    <i className="bi bi-plus-lg" /> Tạo quyền hạn
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4">
                        {editId ? "Chỉnh sửa quyền hạn" : "Tạo quyền hạn mới"}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Tên quyền *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="VD: Xem danh sách tour"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Module *</label>
                            <input value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value }))}
                                placeholder="VD: TOUR, HOTEL, USER"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">API Path *</label>
                            <input value={form.apiPath} onChange={e => setForm(f => ({ ...f, apiPath: e.target.value }))}
                                placeholder="VD: /tours"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Method *</label>
                            <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2 flex gap-3">
                            <button type="submit" disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                                {saving ? "Đang lưu..." : editId ? "Lưu thay đổi" : "Tạo quyền hạn"}
                            </button>
                            <button type="button" onClick={closeForm}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm theo tên, API path, hoặc module..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* Danh sách */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 text-left">Tên quyền</th>
                                <th className="px-6 py-3 text-left">Module</th>
                                <th className="px-6 py-3 text-left">Method</th>
                                <th className="px-6 py-3 text-left">API Path</th>
                                <th className="px-6 py-3 text-left">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{p.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">{p.module}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${METHOD_COLOR[p.method] || "bg-gray-100 text-gray-600"}`}>
                                            {p.method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">{p.apiPath}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(p)}
                                                className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                                <i className="bi bi-pencil mr-1" />Sửa
                                            </button>
                                            <button onClick={() => handleDelete(p.id, p.name)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                                <i className="bi bi-trash3 mr-1" />Xoá
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        {search ? "Không tìm thấy kết quả" : "Chưa có quyền hạn nào"}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PermissionManagement
