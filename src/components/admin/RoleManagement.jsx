import { useEffect, useState } from "react"
import api from "../../api/axiosInstance"
import { toast } from "react-toastify"
import ConfirmDialog from "./ConfirmDialog"

const EMPTY_FORM = { name: "", description: "" }

const RoleManagement = () => {
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState(EMPTY_FORM)
    const [editId, setEditId] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", description: "", variant: "danger", onConfirm: () => {} })

    const fetchRoles = async () => {
        try {
            const res = await api.get("/admin/roles")
            setRoles(res.data)
        } catch { toast.error("Không thể tải danh sách vai trò") }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchRoles() }, [])

    const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
    const openEdit = (role) => { setForm({ name: role.name, description: role.description || "" }); setEditId(role.id); setShowForm(true) }
    const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim()) return toast.error("Tên vai trò không được để trống")
        setSaving(true)
        try {
            if (editId) {
                await api.put(`/admin/roles/${editId}`, form)
                toast.success("Cập nhật vai trò thành công")
            } else {
                await api.post("/admin/roles", form)
                toast.success("Tạo vai trò thành công")
            }
            closeForm()
            fetchRoles()
        } catch (err) { toast.error(err.message || "Thao tác thất bại") }
        finally { setSaving(false) }
    }

    const handleDelete = (id, name) => {
        setConfirmDialog({
            open: true,
            title: `Xoá vai trò "${name}"?`,
            description: "Hành động không thể hoàn tác.",
            variant: "danger",
            onConfirm: async () => {
                setConfirmDialog(s => ({ ...s, open: false }))
                try {
                    await api.delete(`/admin/roles/${id}`)
                    toast.success("Đã xoá vai trò")
                    fetchRoles()
                } catch (err) { toast.error(err.message || "Không thể xoá vai trò này") }
            }
        })
    }

    if (loading) return (
        <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-900">Quản lý vai trò</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{roles.length} vai trò trong hệ thống</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded text-sm font-semibold transition-colors">
                    <i className="bi bi-plus-lg" /> Tạo vai trò
                </button>
            </div>

            {/* Form tạo / chỉnh sửa */}
            {showForm && (
                <div className="bg-indigo-50 border border-indigo-200 rounded p-6">
                    <h3 className="font-bold text-gray-900 mb-4">
                        {editId ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Tên vai trò *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="VD: MANAGER"
                                className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Mô tả</label>
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={2} placeholder="Mô tả quyền hạn của vai trò này..."
                                className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded text-sm font-semibold transition-colors">
                                {saving ? "Đang lưu..." : editId ? "Lưu thay đổi" : "Tạo vai trò"}
                            </button>
                            <button type="button" onClick={closeForm}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded text-sm font-semibold transition-colors">
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Danh sách */}
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#f8f5ee] text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3 text-left">Tên vai trò</th>
                            <th className="px-6 py-3 text-left">Mô tả</th>
                            <th className="px-6 py-3 text-left">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {roles.map(role => (
                            <tr key={role.id} className="hover:bg-[#f8f5ee] transition-colors">
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                                        {role.name}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{role.description || "—"}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEdit(role)}
                                            className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                            <i className="bi bi-pencil mr-1" />Sửa
                                        </button>
                                        <button onClick={() => handleDelete(role.id, role.name)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                            <i className="bi bi-trash3 mr-1" />Xoá
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {roles.length === 0 && (
                    <div className="text-center py-12 text-gray-400">Chưa có vai trò nào</div>
                )}
            </div>
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={v => setConfirmDialog(s => ({ ...s, open: v }))}
                title={confirmDialog.title}
                description={confirmDialog.description}
                variant={confirmDialog.variant}
                onConfirm={confirmDialog.onConfirm}
            />
        </div>
    )
}

export default RoleManagement
