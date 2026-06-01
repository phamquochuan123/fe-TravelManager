import { useEffect, useState } from "react"
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../api/tourApi"
import { toast } from "react-toastify"
import ConfirmDialog from "./ConfirmDialog"

const EMPTY_FORM = {
    code: "", couponType: "PERCENT", discountValue: "",
    minOrderValue: "", usageLimit: 100,
    startDate: "", endDate: "", active: true,
}

const CouponManagement = () => {
    const [coupons, setCoupons] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState(EMPTY_FORM)
    const [editId, setEditId] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", description: "", variant: "danger", onConfirm: () => { } })

    const fetchCoupons = async () => {
        try { setCoupons(await getAllCoupons()) }
        catch { toast.error("Không thể tải danh sách mã giảm giá") }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchCoupons() }, [])

    const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
    const openEdit = (c) => {
        setForm({
            code: c.code, couponType: c.couponType,
            discountValue: c.discountValue, minOrderValue: c.minOrderValue || "",
            usageLimit: c.usageLimit, startDate: c.startDate, endDate: c.endDate, active: c.active,
        })
        setEditId(c.id)
        setShowForm(true)
    }
    const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.code.trim() || !form.discountValue || !form.startDate || !form.endDate) {
            return toast.error("Vui lòng điền đầy đủ thông tin bắt buộc")
        }
        if (new Date(form.endDate) <= new Date(form.startDate)) {
            return toast.error("Ngày kết thúc phải sau ngày bắt đầu")
        }
        setSaving(true)
        try {
            const payload = {
                ...form,
                discountValue: Number(form.discountValue),
                minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
                usageLimit: Number(form.usageLimit),
            }
            if (editId) {
                await updateCoupon(editId, payload)
                toast.success("Cập nhật mã giảm giá thành công")
            } else {
                await createCoupon(payload)
                toast.success("Tạo mã giảm giá thành công")
            }
            closeForm()
            fetchCoupons()
        } catch (err) { toast.error(err.message || "Thao tác thất bại") }
        finally { setSaving(false) }
    }

    const handleDelete = (id, code) => {
        setConfirmDialog({
            open: true,
            title: `Xoá mã coupon "${code}"?`,
            description: "Hành động này không thể hoàn tác.",
            variant: "danger",
            onConfirm: async () => {
                setConfirmDialog(s => ({ ...s, open: false }))
                try {
                    await deleteCoupon(id)
                    toast.success("Đã xoá mã giảm giá")
                    fetchCoupons()
                } catch (err) { toast.error(err.message || "Không thể xoá coupon này") }
            }
        })
    }

    const isExpired = (endDate) => new Date(endDate) < new Date()
    const isActive = (c) => c.active && !isExpired(c.endDate) && (c.usedCount ?? 0) < (c.usageLimit ?? Infinity)

    if (loading) return (
        <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-900">Mã giảm giá tour</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{coupons.length} mã coupon</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded text-sm font-semibold transition-colors">
                    <i className="bi bi-plus-lg" /> Tạo mã mới
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-indigo-50 border border-indigo-200 rounded p-6">
                    <h3 className="font-bold text-gray-900 mb-4">
                        {editId ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Mã coupon *</label>
                            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                placeholder="VD: SUMMER2025"
                                className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Loại giảm giá *</label>
                            <select value={form.couponType} onChange={e => setForm(f => ({ ...f, couponType: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="PERCENT">Phần trăm (%)</option>
                                <option value="FIXED">Số tiền cố định (₫)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">
                                Giá trị giảm * {form.couponType === "PERCENT" ? "(%)" : "(₫)"}
                            </label>
                            <input type="number" value={form.discountValue}
                                onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                                min="1" max={form.couponType === "PERCENT" ? 100 : undefined}
                                placeholder={form.couponType === "PERCENT" ? "VD: 20" : "VD: 200000"}
                                className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Đơn hàng tối thiểu (₫)</label>
                            <input type="number" value={form.minOrderValue}
                                onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))}
                                placeholder="Để trống nếu không giới hạn"
                                className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Giới hạn sử dụng</label>
                            <input type="number" value={form.usageLimit}
                                onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                                min="1" className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-gray-700">Kích hoạt</label>
                            <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                                className={`w-12 h-6 rounded-full transition-colors ${form.active ? "bg-indigo-500" : "bg-gray-300"}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.active ? "translate-x-6" : "translate-x-0"}`} />
                            </button>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Ngày bắt đầu *</label>
                            <input type="date" value={form.startDate}
                                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Ngày kết thúc *</label>
                            <input type="date" value={form.endDate}
                                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="md:col-span-2 flex gap-3">
                            <button type="submit" disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded text-sm font-semibold transition-colors">
                                {saving ? "Đang lưu..." : editId ? "Lưu thay đổi" : "Tạo mã"}
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {coupons.map(c => (
                    <div key={c.id} className={`bg-white rounded border p-5 shadow-sm ${isActive(c) ? "border-emerald-200" : "border-gray-100 opacity-70"}`}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="font-black text-gray-900 font-mono text-lg tracking-wide">{c.code}</p>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mt-1 ${isActive(c) ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                    <i className={`bi bi-${isActive(c) ? "check-circle" : "x-circle"}`} />
                                    {isActive(c) ? "Đang hoạt động" : isExpired(c.endDate) ? "Hết hạn" : "Đã tắt"}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-indigo-600">
                                    {c.couponType === "PERCENT" ? `${c.discountValue}%` : `${Number(c.discountValue).toLocaleString("vi-VN")}₫`}
                                </p>
                                <p className="text-xs text-gray-400">{c.couponType === "PERCENT" ? "phần trăm" : "cố định"}</p>
                            </div>
                        </div>

                        <div className="space-y-1 text-xs text-gray-500 mb-4">
                            {c.minOrderValue && (
                                <p><i className="bi bi-cart-check mr-1.5 text-gray-400" />Tối thiểu: {Number(c.minOrderValue).toLocaleString("vi-VN")} ₫</p>
                            )}
                            <p><i className="bi bi-people mr-1.5 text-gray-400" />Đã dùng: {c.usedCount} / {c.usageLimit} lần</p>
                            <p><i className="bi bi-calendar-range mr-1.5 text-gray-400" />{c.startDate} → {c.endDate}</p>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                            <div className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${c.usageLimit ? Math.min(((c.usedCount ?? 0) / c.usageLimit) * 100, 100) : 0}%` }} />
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => openEdit(c)}
                                className="flex-1 text-indigo-600 border border-indigo-200 hover:bg-indigo-50 py-1.5 rounded text-xs font-semibold transition-colors">
                                <i className="bi bi-pencil mr-1" />Sửa
                            </button>
                            <button onClick={() => handleDelete(c.id, c.code)}
                                className="flex-1 text-red-500 border border-red-200 hover:bg-red-50 py-1.5 rounded text-xs font-semibold transition-colors">
                                <i className="bi bi-trash3 mr-1" />Xoá
                            </button>
                        </div>
                    </div>
                ))}
                {coupons.length === 0 && (
                    <div className="md:col-span-3 text-center py-12 text-gray-400">Chưa có mã giảm giá nào</div>
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

export default CouponManagement
