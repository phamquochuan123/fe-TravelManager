import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import {
    getAllRestaurants, createRestaurant, updateRestaurant,
    deleteRestaurant, toggleRestaurantActive, uploadRestaurantPhoto
} from "../../api/restaurantApi"
import ConfirmDialog from "../admin/ConfirmDialog"

const CUISINE_LABEL = {
    VIETNAMESE: "Việt Nam", ASIAN: "Châu Á", WESTERN: "Âu Mỹ",
    SEAFOOD: "Hải sản", BBQ: "BBQ", VEGETARIAN: "Chay", FUSION: "Fusion", OTHER: "Khác"
}
const PRICE_LABEL = { BUDGET: "Bình dân", STANDARD: "Trung bình", PREMIUM: "Cao cấp", LUXURY: "Hạng sang" }
const PRICE_COLOR = {
    BUDGET: "bg-green-100 text-green-700", STANDARD: "bg-blue-100 text-blue-700",
    PREMIUM: "bg-purple-100 text-purple-700", LUXURY: "bg-amber-100 text-amber-700"
}

const EMPTY_FORM = {
    name: "", description: "", address: "", city: "",
    cuisineType: "VIETNAMESE", priceRange: "STANDARD",
    capacity: "", openingHours: "", amenities: "", isActive: true
}

const RestaurantManagement = () => {
    const navigate = useNavigate()
    const [restaurants, setRestaurants] = useState([])
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

    const fetchRestaurants = () => {
        setLoading(true)
        getAllRestaurants(null, true).then(setRestaurants).catch(e => toast.error(e.message)).finally(() => setLoading(false))
    }

    useEffect(() => { fetchRestaurants() }, [])

    const openAdd = () => { setForm(EMPTY_FORM); setEditingItem(null); setView("add") }
    const openEdit = (item) => {
        setEditingItem(item)
        setForm({
            name: item.name || "", description: item.description || "",
            address: item.address || "", city: item.city || "",
            cuisineType: item.cuisineType || "VIETNAMESE",
            priceRange: item.priceRange || "STANDARD",
            capacity: item.capacity || "", openingHours: item.openingHours || "",
            amenities: item.amenities || "", isActive: item.active !== false
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
        if (!form.name.trim() || !form.city.trim()) {
            toast.error("Tên và thành phố là bắt buộc")
            return
        }
        setSaving(true)
        try {
            const payload = {
                ...form,
                capacity: form.capacity ? Number(form.capacity) : null,
            }
            if (view === "add") {
                await createRestaurant(payload)
                toast.success("Tạo nhà hàng thành công!")
            } else {
                await updateRestaurant(editingItem.id, payload)
                toast.success("Cập nhật thành công!")
            }
            fetchRestaurants()
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
            title: `Xoá nhà hàng "${item.name}"?`,
            description: "Hành động này không thể hoàn tác.",
            variant: "danger",
            onConfirm: async () => {
                setConfirmDialog(s => ({ ...s, open: false }))
                setDeletingId(item.id)
                try {
                    await deleteRestaurant(item.id)
                    toast.success("Đã xoá nhà hàng")
                    fetchRestaurants()
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
            await toggleRestaurantActive(item.id)
            toast.success(item.active ? "Đã tắt hoạt động" : "Đã bật hoạt động")
            fetchRestaurants()
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
            await uploadRestaurantPhoto(photoItem.id, photoFile)
            toast.success("Cập nhật ảnh thành công!")
            fetchRestaurants()
            setView("list")
        } catch (e) {
            toast.error(e.message)
        } finally {
            setUploadingPhoto(false)
        }
    }

    const filtered = restaurants.filter(r => {
        const q = search.toLowerCase()
        return !q || r.name?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q)
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
                    <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-8 cursor-pointer hover:border-orange-400 hover:bg-orange-50/20 transition-all mb-4">
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
                            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-60 text-sm">
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
                        {view === "add" ? "Thêm nhà hàng mới" : `Chỉnh sửa: ${editingItem?.name}`}
                    </h2>
                </div>
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 max-w-3xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tên nhà hàng *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Nhà hàng Biển Xanh..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Thành phố *</label>
                            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                                placeholder="Hà Nội, Đà Nẵng..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ</label>
                            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                placeholder="123 Nguyễn Văn A..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Loại ẩm thực</label>
                            <select value={form.cuisineType} onChange={e => setForm(f => ({ ...f, cuisineType: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                                {Object.entries(CUISINE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Phân khúc giá</label>
                            <select value={form.priceRange} onChange={e => setForm(f => ({ ...f, priceRange: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                                {Object.entries(PRICE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Sức chứa (người)</label>
                            <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                                placeholder="50" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Giờ mở cửa</label>
                            <input value={form.openingHours} onChange={e => setForm(f => ({ ...f, openingHours: e.target.value }))}
                                placeholder="10:00 - 22:00" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả</label>
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={3} placeholder="Không gian ấm cúng, phục vụ ẩm thực..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tiện ích (cách nhau bởi dấu phẩy)</label>
                            <input value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))}
                                placeholder="Wifi miễn phí, Chỗ đậu xe, Máy lạnh..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-3">
                            <input type="checkbox" id="restaurantActive" checked={form.isActive}
                                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                className="w-4 h-4 rounded accent-orange-500" />
                            <label htmlFor="restaurantActive" className="text-sm font-semibold text-gray-700 cursor-pointer">Hoạt động (hiển thị trên website)</label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving}
                            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-60 text-sm">
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
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhà hàng..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <button onClick={openAdd}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shrink-0">
                    <i className="bi bi-plus-circle" /> Thêm nhà hàng
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                    { label: "Tổng", value: restaurants.length, icon: "bi-shop", color: "text-orange-600 bg-orange-50" },
                    { label: "Hoạt động", value: restaurants.filter(r => r.active !== false).length, icon: "bi-check-circle", color: "text-emerald-600 bg-emerald-50" },
                    { label: "Tạm đóng", value: restaurants.filter(r => r.active === false).length, icon: "bi-pause-circle", color: "text-gray-500 bg-gray-50" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}><i className={`bi ${s.icon}`} /></div>
                        <div><p className="text-lg font-black text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <i className="bi bi-shop text-4xl text-gray-300 block mb-2" /><p className="text-gray-500">Không tìm thấy nhà hàng</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 text-left">Nhà hàng</th>
                                    <th className="px-5 py-3 text-left">Ẩm thực</th>
                                    <th className="px-5 py-3 text-left">Phân khúc</th>
                                    <th className="px-5 py-3 text-left">Thành phố</th>
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
                                                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                                        <i className="bi bi-shop text-orange-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                                                    {item.address && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.address}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{CUISINE_LABEL[item.cuisineType] || item.cuisineType}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PRICE_COLOR[item.priceRange] || "bg-gray-100 text-gray-600"}`}>
                                                {PRICE_LABEL[item.priceRange] || item.priceRange}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{item.city}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.active !== false ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                                {item.active !== false ? "Hoạt động" : "Tạm đóng"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openPhoto(item)} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg" title="Cập nhật ảnh">
                                                    <i className="bi bi-image" />
                                                </button>
                                                <button onClick={() => navigate(`/restaurants/${item.id}`)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Xem trang">
                                                    <i className="bi bi-eye" />
                                                </button>
                                                <button onClick={() => handleToggleActive(item)} disabled={togglingId === item.id}
                                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${item.active !== false ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                                                    title={item.active !== false ? "Tắt hoạt động" : "Bật hoạt động"}>
                                                    {togglingId === item.id ? <span className="w-3.5 h-3.5 border border-gray-400/30 border-t-gray-500 rounded-full animate-spin inline-block" /> : <i className={`bi ${item.active !== false ? "bi-toggle-on" : "bi-toggle-off"}`} />}
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

export default RestaurantManagement
