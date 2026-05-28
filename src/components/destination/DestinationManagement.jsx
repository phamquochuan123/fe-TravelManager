import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import {
    getAllDestinations, createDestination, updateDestination,
    deleteDestination, toggleDestinationActive, uploadDestinationPhoto
} from "../../api/destinationApi"
import ConfirmDialog from "../admin/ConfirmDialog"

const TYPE_LABEL = {
    NATURE: "Thiên nhiên", CULTURE: "Văn hóa", FOOD: "Ẩm thực",
    ENTERTAINMENT: "Giải trí", BEACH: "Biển", MOUNTAIN: "Núi", CITY: "Thành phố"
}
const TYPE_COLOR = {
    NATURE: "bg-green-100 text-green-700", CULTURE: "bg-amber-100 text-amber-700",
    FOOD: "bg-orange-100 text-orange-700", ENTERTAINMENT: "bg-purple-100 text-purple-700",
    BEACH: "bg-sky-100 text-sky-700", MOUNTAIN: "bg-stone-100 text-stone-700",
    CITY: "bg-indigo-100 text-indigo-700"
}
const TYPE_ICON = {
    NATURE: "bi-tree", CULTURE: "bi-bank", FOOD: "bi-egg-fried",
    ENTERTAINMENT: "bi-controller", BEACH: "bi-water", MOUNTAIN: "bi-triangle",
    CITY: "bi-buildings"
}

const EMPTY_FORM = {
    name: "", description: "", destinationType: "NATURE",
    province: "", city: "", isActive: true
}

const DestinationManagement = () => {
    const navigate = useNavigate()
    const [destinations, setDestinations] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [view, setView] = useState("list") // list | add | edit | photo
    const [editingItem, setEditingItem] = useState(null)
    const [photoItem, setPhotoItem] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [togglingId, setTogglingId] = useState(null)
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", description: "", variant: "danger", onConfirm: () => {} })

    const fetchDestinations = () => {
        setLoading(true)
        getAllDestinations(null, true).then(setDestinations).catch(e => toast.error(e.message)).finally(() => setLoading(false))
    }

    useEffect(() => { fetchDestinations() }, [])

    const openAdd = () => { setForm(EMPTY_FORM); setEditingItem(null); setView("add") }
    const openEdit = (item) => {
        setEditingItem(item)
        setForm({
            name: item.name || "", description: item.description || "",
            destinationType: item.destinationType || "NATURE",
            province: item.province || "", city: item.city || "",
            isActive: item.active !== false
        })
        setView("edit")
    }
    const openPhoto = (item) => {
        setPhotoItem(item)
        setPhotoFile(null)
        setPhotoPreview(item.photo ? `data:image/jpeg;base64,${item.photo}` : null)
        setView("photo")
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim()) { toast.error("Tên địa điểm là bắt buộc"); return }
        setSaving(true)
        try {
            const payload = { ...form }
            if (view === "add") {
                await createDestination(payload)
                toast.success("Tạo địa điểm thành công!")
            } else {
                await updateDestination(editingItem.id, payload)
                toast.success("Cập nhật thành công!")
            }
            fetchDestinations()
            setView("list")
        } catch (e) {
            toast.error(e.response?.data?.message || e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (item) => {
        setConfirmDialog({
            open: true,
            title: `Xoá địa điểm "${item.name}"?`,
            description: "Hành động này không thể hoàn tác.",
            variant: "danger",
            onConfirm: async () => {
                setConfirmDialog(s => ({ ...s, open: false }))
                setDeletingId(item.id)
                try {
                    await deleteDestination(item.id)
                    toast.success("Đã xoá địa điểm")
                    fetchDestinations()
                } catch (e) {
                    toast.error(e.message)
                } finally {
                    setDeletingId(null)
                }
            }
        })
    }

    const handleToggleActive = async (item) => {
        setTogglingId(item.id)
        try {
            await toggleDestinationActive(item.id)
            toast.success(item.active ? "Đã ẩn địa điểm" : "Đã hiện địa điểm")
            fetchDestinations()
        } catch (e) {
            toast.error(e.message)
        } finally {
            setTogglingId(null)
        }
    }

    const handleUploadPhoto = async (e) => {
        e.preventDefault()
        if (!photoFile) { toast.error("Chọn ảnh trước"); return }
        setUploadingPhoto(true)
        try {
            await uploadDestinationPhoto(photoItem.id, photoFile)
            toast.success("Cập nhật ảnh thành công!")
            fetchDestinations()
            setView("list")
        } catch (e) {
            toast.error(e.message)
        } finally {
            setUploadingPhoto(false)
        }
    }

    const filtered = destinations.filter(d => {
        const q = search.toLowerCase()
        return !q || d.name?.toLowerCase().includes(q) || d.city?.toLowerCase().includes(q) || d.province?.toLowerCase().includes(q)
    })

    // ── Photo view ────────────────────────────────────────────────
    if (view === "photo") {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setView("list")} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium">
                        <i className="bi bi-arrow-left" /> Quay lại
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">Ảnh đại diện: {photoItem?.name}</h2>
                </div>
                <form onSubmit={handleUploadPhoto} className="max-w-md">
                    <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-8 cursor-pointer hover:border-sky-400 hover:bg-sky-50/20 transition-all mb-4">
                        {photoPreview ? (
                            <img src={photoPreview} alt="" className="w-full max-h-64 object-cover rounded-xl" />
                        ) : (
                            <><i className="bi bi-cloud-upload text-4xl text-gray-400" /><span className="text-sm text-gray-500">Chọn ảnh PNG/JPG</span></>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                            const f = e.target.files[0]; if (!f) return
                            setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f))
                        }} />
                    </label>
                    <div className="flex gap-3">
                        <button type="submit" disabled={uploadingPhoto || !photoFile}
                            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-60 text-sm">
                            {uploadingPhoto ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang tải...</> : <><i className="bi bi-upload" /> Lưu ảnh</>}
                        </button>
                        <button type="button" onClick={() => setView("list")} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm">Huỷ</button>
                    </div>
                </form>
            </div>
        )
    }

    // ── Form view ────────────────────────────────────────────────
    if (view === "add" || view === "edit") {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setView("list")} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium">
                        <i className="bi bi-arrow-left" /> Quay lại
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">
                        {view === "add" ? "Thêm địa điểm mới" : `Chỉnh sửa: ${editingItem?.name}`}
                    </h2>
                </div>
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 max-w-3xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tên địa điểm *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Vịnh Hạ Long, Phố Cổ Hội An..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Loại địa điểm</label>
                            <select value={form.destinationType} onChange={e => setForm(f => ({ ...f, destinationType: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Thành phố</label>
                            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                                placeholder="Hội An, Đà Lạt..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tỉnh / Vùng</label>
                            <input value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                                placeholder="Quảng Nam, Lâm Đồng..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả</label>
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={4} placeholder="Khám phá vẻ đẹp thiên nhiên..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-3">
                            <input type="checkbox" id="destActive" checked={form.isActive}
                                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                className="w-4 h-4 rounded accent-sky-500" />
                            <label htmlFor="destActive" className="text-sm font-semibold text-gray-700 cursor-pointer">Hiển thị trên website</label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving}
                            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-60 text-sm">
                            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</> : "Lưu"}
                        </button>
                        <button type="button" onClick={() => setView("list")} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm">Huỷ</button>
                    </div>
                </form>
            </div>
        )
    }

    // ── List view ────────────────────────────────────────────────
    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm địa điểm..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <button onClick={openAdd}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shrink-0">
                    <i className="bi bi-plus-circle" /> Thêm địa điểm
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                    { label: "Tổng", value: destinations.length, icon: "bi-geo-alt", color: "text-sky-600 bg-sky-50" },
                    { label: "Hiển thị", value: destinations.filter(d => d.active !== false).length, icon: "bi-eye", color: "text-emerald-600 bg-emerald-50" },
                    { label: "Đã ẩn", value: destinations.filter(d => d.active === false).length, icon: "bi-eye-slash", color: "text-gray-500 bg-gray-50" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}><i className={`bi ${s.icon}`} /></div>
                        <div><p className="text-lg font-black text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <i className="bi bi-geo-alt text-4xl text-gray-300 block mb-2" /><p className="text-gray-500">Không tìm thấy địa điểm</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 text-left">Địa điểm</th>
                                    <th className="px-5 py-3 text-left">Loại</th>
                                    <th className="px-5 py-3 text-left">Thành phố</th>
                                    <th className="px-5 py-3 text-left">Tỉnh</th>
                                    <th className="px-5 py-3 text-left">Trạng thái</th>
                                    <th className="px-5 py-3 text-left">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {item.photo ? (
                                                    <img src={`data:image/jpeg;base64,${item.photo}`} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                                                        <i className={`bi ${TYPE_ICON[item.destinationType] || "bi-geo-alt"} text-sky-400`} />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_COLOR[item.destinationType] || "bg-gray-100 text-gray-600"}`}>
                                                <i className={`bi ${TYPE_ICON[item.destinationType] || "bi-geo-alt"} mr-1`} />
                                                {TYPE_LABEL[item.destinationType] || item.destinationType}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{item.city || "—"}</td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{item.province || "—"}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.active !== false ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                                {item.active !== false ? "Hiển thị" : "Đã ẩn"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openPhoto(item)} className="p-1.5 text-gray-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg" title="Cập nhật ảnh">
                                                    <i className="bi bi-image" />
                                                </button>
                                                <button onClick={() => navigate(`/destinations/${item.id}`)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Xem trang">
                                                    <i className="bi bi-eye" />
                                                </button>
                                                <button onClick={() => handleToggleActive(item)} disabled={togglingId === item.id}
                                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${item.active !== false ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                                                    title={item.active !== false ? "Ẩn địa điểm" : "Hiện địa điểm"}>
                                                    {togglingId === item.id ? <span className="w-3.5 h-3.5 border border-gray-400/30 border-t-gray-500 rounded-full animate-spin inline-block" /> : <i className={`bi ${item.active !== false ? "bi-eye-slash" : "bi-eye"}`} />}
                                                </button>
                                                <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Chỉnh sửa">
                                                    <i className="bi bi-pencil" />
                                                </button>
                                                <button onClick={() => handleDelete(item)} disabled={deletingId === item.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50" title="Xoá">
                                                    {deletingId === item.id ? <span className="w-3.5 h-3.5 border border-red-400/30 border-t-red-500 rounded-full animate-spin inline-block" /> : <i className="bi bi-trash3" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
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

export default DestinationManagement
