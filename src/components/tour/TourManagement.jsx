import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import {
    getAllTours, createTour, updateTour, deleteTour,
    getTourById, addTourImage, deleteTourImage, addTourItinerary, updateTourItinerary,
    deleteTourItinerary, addTourDeparture, deleteTourDeparture
} from "../../api/tourApi"

const TOUR_TYPE_LABEL = { DOMESTIC: "Trong nước", INTERNATIONAL: "Quốc tế" }
const TOUR_TYPE_COLOR = { DOMESTIC: "bg-emerald-100 text-emerald-700", INTERNATIONAL: "bg-blue-100 text-blue-700" }
const STATUS_LABEL = { ACTIVE: "Hoạt động", INACTIVE: "Tạm đóng", DRAFT: "Nháp" }
const STATUS_COLOR = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    INACTIVE: "bg-gray-100 text-gray-500",
    DRAFT: "bg-amber-100 text-amber-700"
}

const EMPTY_FORM = {
    name: "", description: "", destination: "", departure: "",
    tourType: "DOMESTIC", priceAdult: "", priceChild: "",
    durationDays: 1, maxSlots: 10, cancellationPolicy: "", includedServices: ""
}
const EMPTY_ITINERARY = { dayNumber: 1, title: "", description: "", activities: "" }
const EMPTY_DEPARTURE = { departureDate: "", availableSlots: 10 }

const TourManagement = () => {
    const navigate = useNavigate()
    const [tours, setTours] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [view, setView] = useState("list") // list | add | edit | detail
    const [editingTour, setEditingTour] = useState(null)
    const [detailTour, setDetailTour] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [detailTab, setDetailTab] = useState("itineraries") // itineraries | departures | images

    // Sub-resource state
    const [itineraryForm, setItineraryForm] = useState(EMPTY_ITINERARY)
    const [editingItinerary, setEditingItinerary] = useState(null)
    const [departureForm, setDepartureForm] = useState(EMPTY_DEPARTURE)
    const [imageFile, setImageFile] = useState(null)
    const [subSaving, setSubSaving] = useState(false)
    const [deletingSubId, setDeletingSubId] = useState(null)

    const fetchTours = () => {
        setLoading(true)
        getAllTours(true).then(setTours).catch(e => toast.error(e.message)).finally(() => setLoading(false))
    }

    const fetchDetail = (id) => {
        setDetailLoading(true)
        getTourById(id).then(setDetailTour).catch(() => toast.error("Không thể tải chi tiết tour")).finally(() => setDetailLoading(false))
    }

    useEffect(() => { fetchTours() }, [])

    const openAdd = () => { setForm(EMPTY_FORM); setEditingTour(null); setView("add") }
    const openEdit = async (tour) => {
        setEditingTour(tour)
        setView("edit")
        // TourResponse (list) thiếu description/cancellationPolicy/includedServices
        // nên cần fetch TourDetailResponse để có đủ dữ liệu
        try {
            const full = await getTourById(tour.id)
            setForm({
                name: full.name || "", description: full.description || "",
                destination: full.destination || "", departure: full.departure || "",
                tourType: full.tourType || "DOMESTIC",
                priceAdult: full.priceAdult || "", priceChild: full.priceChild || "",
                durationDays: full.durationDays || 1, maxSlots: full.maxSlots || 10,
                cancellationPolicy: full.cancellationPolicy || "",
                includedServices: full.includedServices || ""
            })
        } catch {
            setForm({
                name: tour.name || "", description: "",
                destination: tour.destination || "", departure: tour.departure || "",
                tourType: tour.tourType || "DOMESTIC",
                priceAdult: tour.priceAdult || "", priceChild: tour.priceChild || "",
                durationDays: tour.durationDays || 1, maxSlots: tour.maxSlots || 10,
                cancellationPolicy: "", includedServices: ""
            })
        }
    }
    const openDetail = (tour) => {
        setDetailTour(null)
        setDetailTab("itineraries")
        setItineraryForm(EMPTY_ITINERARY)
        setDepartureForm(EMPTY_DEPARTURE)
        setImageFile(null)
        setEditingItinerary(null)
        fetchDetail(tour.id)
        setView("detail")
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.destination.trim() || !form.departure.trim()) {
            toast.error("Vui lòng điền đầy đủ các trường bắt buộc")
            return
        }
        setSaving(true)
        try {
            const payload = {
                ...form,
                priceAdult: Number(form.priceAdult),
                priceChild: Number(form.priceChild) || 0,
                durationDays: Number(form.durationDays),
                maxSlots: Number(form.maxSlots),
            }
            if (view === "add") {
                const created = await createTour(payload)
                toast.success("Tạo tour thành công!")
                fetchTours()
                openDetail(created)
            } else {
                await updateTour(editingTour.id, payload)
                toast.success("Cập nhật tour thành công!")
                fetchTours()
                setView("list")
            }
        } catch (e) {
            toast.error(e.response?.data?.message || e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (tour) => {
        if (!window.confirm(`Xoá tour "${tour.name}"?`)) return
        setDeletingId(tour.id)
        try {
            await deleteTour(tour.id)
            toast.success("Đã xoá tour")
            fetchTours()
        } catch (e) {
            toast.error(e.message)
        } finally {
            setDeletingId(null)
        }
    }

    // ── Itinerary ────────────────────────────────────────────────
    const handleSaveItinerary = async (e) => {
        e.preventDefault()
        if (!itineraryForm.title.trim()) { toast.error("Cần nhập tiêu đề"); return }
        setSubSaving(true)
        try {
            if (editingItinerary) {
                await updateTourItinerary(detailTour.id, editingItinerary.id, itineraryForm)
                toast.success("Cập nhật lịch trình thành công")
            } else {
                await addTourItinerary(detailTour.id, itineraryForm)
                toast.success("Thêm lịch trình thành công")
            }
            setItineraryForm(EMPTY_ITINERARY)
            setEditingItinerary(null)
            fetchDetail(detailTour.id)
        } catch (e) {
            toast.error(e.message)
        } finally {
            setSubSaving(false)
        }
    }

    const handleDeleteItinerary = async (id) => {
        if (!window.confirm("Xoá lịch trình này?")) return
        setDeletingSubId(id)
        try {
            await deleteTourItinerary(detailTour.id, id)
            toast.success("Đã xoá")
            fetchDetail(detailTour.id)
        } catch (e) {
            toast.error(e.message)
        } finally {
            setDeletingSubId(null)
        }
    }

    // ── Departure ────────────────────────────────────────────────
    const handleAddDeparture = async (e) => {
        e.preventDefault()
        if (!departureForm.departureDate) { toast.error("Chọn ngày khởi hành"); return }
        setSubSaving(true)
        try {
            await addTourDeparture(detailTour.id, {
                departureDate: departureForm.departureDate,
                availableSlots: Number(departureForm.availableSlots)
            })
            toast.success("Thêm ngày khởi hành thành công")
            setDepartureForm(EMPTY_DEPARTURE)
            fetchDetail(detailTour.id)
        } catch (e) {
            toast.error(e.message)
        } finally {
            setSubSaving(false)
        }
    }

    const handleDeleteDeparture = async (id) => {
        if (!window.confirm("Xoá ngày khởi hành này?")) return
        setDeletingSubId(id)
        try {
            await deleteTourDeparture(detailTour.id, id)
            toast.success("Đã xoá")
            fetchDetail(detailTour.id)
        } catch (e) {
            toast.error(e.message)
        } finally {
            setDeletingSubId(null)
        }
    }

    // ── Image ────────────────────────────────────────────────────
    const handleUploadImage = async (e) => {
        e.preventDefault()
        if (!imageFile) { toast.error("Chọn ảnh trước"); return }
        setSubSaving(true)
        try {
            await addTourImage(detailTour.id, imageFile)
            toast.success("Thêm ảnh thành công")
            setImageFile(null)
            fetchDetail(detailTour.id)
        } catch (e) {
            toast.error(e.message)
        } finally {
            setSubSaving(false)
        }
    }

    const handleDeleteImage = async (imageId) => {
        if (!window.confirm("Xoá ảnh này?")) return
        setDeletingSubId(imageId)
        try {
            await deleteTourImage(detailTour.id, imageId)
            toast.success("Đã xoá ảnh")
            fetchDetail(detailTour.id)
        } catch (e) {
            toast.error(e.message)
        } finally {
            setDeletingSubId(null)
        }
    }

    const filtered = tours.filter(t => {
        const q = search.toLowerCase()
        return !q || t.name?.toLowerCase().includes(q) || t.destination?.toLowerCase().includes(q)
    })

    // ── Form view ────────────────────────────────────────────────
    if (view === "add" || view === "edit") {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setView("list")} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium">
                        <i className="bi bi-arrow-left" /> Quay lại
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">
                        {view === "add" ? "Thêm tour mới" : `Chỉnh sửa: ${editingTour?.name}`}
                    </h2>
                </div>
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 max-w-3xl space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tên tour *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Tour Đà Lạt 3N2Đ..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Điểm đến *</label>
                            <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                                placeholder="Đà Lạt, Hội An..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Điểm khởi hành *</label>
                            <input value={form.departure} onChange={e => setForm(f => ({ ...f, departure: e.target.value }))}
                                placeholder="Hà Nội, TP. HCM..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Loại tour</label>
                            <select value={form.tourType} onChange={e => setForm(f => ({ ...f, tourType: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="DOMESTIC">Trong nước</option>
                                <option value="INTERNATIONAL">Quốc tế</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Số ngày</label>
                            <input type="number" min="1" value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Giá người lớn (₫) *</label>
                            <input type="number" min="0" value={form.priceAdult} onChange={e => setForm(f => ({ ...f, priceAdult: e.target.value }))}
                                placeholder="2000000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Giá trẻ em (₫)</label>
                            <input type="number" min="0" value={form.priceChild} onChange={e => setForm(f => ({ ...f, priceChild: e.target.value }))}
                                placeholder="1500000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Số slot tối đa</label>
                            <input type="number" min="1" value={form.maxSlots} onChange={e => setForm(f => ({ ...f, maxSlots: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả</label>
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={3} placeholder="Khám phá vẻ đẹp..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Dịch vụ bao gồm</label>
                            <textarea value={form.includedServices} onChange={e => setForm(f => ({ ...f, includedServices: e.target.value }))}
                                rows={2} placeholder="Xe đưa đón, Ăn sáng, Hướng dẫn viên..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Chính sách huỷ</label>
                            <textarea value={form.cancellationPolicy} onChange={e => setForm(f => ({ ...f, cancellationPolicy: e.target.value }))}
                                rows={2} placeholder="Huỷ trước 7 ngày hoàn 100%..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-60 text-sm">
                            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</> : view === "add" ? "Tạo tour & quản lý chi tiết" : "Lưu thay đổi"}
                        </button>
                        <button type="button" onClick={() => setView("list")}
                            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm">
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    // ── Detail / Sub-resource management ────────────────────────
    if (view === "detail") {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => { setView("list"); setDetailTour(null) }} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium">
                        <i className="bi bi-arrow-left" /> Danh sách tour
                    </button>
                    {detailTour && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{detailTour.name}</h2>
                            <p className="text-sm text-emerald-600 font-medium">{detailTour.destination}</p>
                        </div>
                    )}
                </div>

                {detailLoading ? (
                    <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" /></div>
                ) : detailTour && (
                    <div>
                        {/* Quick info */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 flex flex-wrap gap-4 items-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${TOUR_TYPE_COLOR[detailTour.tourType]}`}>{TOUR_TYPE_LABEL[detailTour.tourType]}</span>
                            <span className="text-sm text-gray-600"><i className="bi bi-clock mr-1" />{detailTour.durationDays} ngày</span>
                            <span className="text-sm text-gray-600"><i className="bi bi-people mr-1" />Tối đa {detailTour.maxSlots} slot</span>
                            <span className="text-sm text-gray-600 font-semibold text-emerald-700">
                                {Number(detailTour.priceAdult).toLocaleString("vi-VN")} ₫/người lớn
                            </span>
                            <button onClick={() => navigate(`/tours/${detailTour.id}`)}
                                className="ml-auto text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                <i className="bi bi-eye" /> Xem trang tour
                            </button>
                        </div>

                        {/* Sub-resource tabs */}
                        <div className="flex gap-2 mb-5 border-b border-gray-200">
                            {[
                                { key: "itineraries", icon: "bi-map", label: "Lịch trình", count: detailTour.itineraries?.length },
                                { key: "departures", icon: "bi-calendar3", label: "Ngày khởi hành", count: detailTour.departures?.length },
                                { key: "images", icon: "bi-images", label: "Hình ảnh", count: detailTour.images?.length },
                            ].map(t => (
                                <button key={t.key} onClick={() => setDetailTab(t.key)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${detailTab === t.key ? "bg-white border border-b-white border-gray-200 text-emerald-600 -mb-px" : "text-gray-500 hover:text-gray-700"}`}>
                                    <i className={`bi ${t.icon}`} />{t.label}
                                    {t.count > 0 && <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-1.5">{t.count}</span>}
                                </button>
                            ))}
                        </div>

                        {/* Itineraries */}
                        {detailTab === "itineraries" && (
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                                <div className="lg:col-span-3 space-y-3">
                                    {detailTour.itineraries?.length === 0 && (
                                        <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
                                            <i className="bi bi-map text-3xl block mb-2" />Chưa có lịch trình
                                        </div>
                                    )}
                                    {detailTour.itineraries?.sort((a, b) => a.dayNumber - b.dayNumber).map(item => (
                                        <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center shrink-0">
                                                N{item.dayNumber}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                                                {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>}
                                                {item.activities && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1"><i className="bi bi-check2 mr-1" />{item.activities}</p>}
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <button onClick={() => { setEditingItinerary(item); setItineraryForm({ dayNumber: item.dayNumber, title: item.title, description: item.description || "", activities: item.activities || "" }) }}
                                                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><i className="bi bi-pencil" /></button>
                                                <button onClick={() => handleDeleteItinerary(item.id)} disabled={deletingSubId === item.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40">
                                                    {deletingSubId === item.id ? <span className="w-3.5 h-3.5 border border-red-400/30 border-t-red-500 rounded-full animate-spin inline-block" /> : <i className="bi bi-trash3" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
                                        <h3 className="font-bold text-gray-900 mb-4 text-sm">{editingItinerary ? "Chỉnh sửa lịch trình" : "Thêm lịch trình"}</h3>
                                        <form onSubmit={handleSaveItinerary} className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày thứ</label>
                                                <input type="number" min="1" value={itineraryForm.dayNumber} onChange={e => setItineraryForm(f => ({ ...f, dayNumber: e.target.value }))}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Tiêu đề *</label>
                                                <input value={itineraryForm.title} onChange={e => setItineraryForm(f => ({ ...f, title: e.target.value }))}
                                                    placeholder="Khởi hành - Tham quan..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả</label>
                                                <textarea value={itineraryForm.description} onChange={e => setItineraryForm(f => ({ ...f, description: e.target.value }))}
                                                    rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Hoạt động</label>
                                                <input value={itineraryForm.activities} onChange={e => setItineraryForm(f => ({ ...f, activities: e.target.value }))}
                                                    placeholder="Tham quan, Ăn trưa..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="submit" disabled={subSaving}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                                                    {subSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editingItinerary ? "Cập nhật" : "Thêm"}
                                                </button>
                                                {editingItinerary && (
                                                    <button type="button" onClick={() => { setEditingItinerary(null); setItineraryForm(EMPTY_ITINERARY) }}
                                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm">Huỷ</button>
                                                )}
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Departures */}
                        {detailTab === "departures" && (
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                                <div className="lg:col-span-3 space-y-3">
                                    {detailTour.departures?.length === 0 && (
                                        <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
                                            <i className="bi bi-calendar-x text-3xl block mb-2" />Chưa có ngày khởi hành
                                        </div>
                                    )}
                                    {detailTour.departures?.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate)).map(dep => (
                                        <div key={dep.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <i className="bi bi-calendar3" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 text-sm">{new Date(dep.departureDate).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                                                <p className={`text-xs mt-0.5 ${dep.availableSlots > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                                    {dep.availableSlots > 0 ? `Còn ${dep.availableSlots} slot` : "Hết slot"}
                                                </p>
                                            </div>
                                            <button onClick={() => handleDeleteDeparture(dep.id)} disabled={deletingSubId === dep.id}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40">
                                                {deletingSubId === dep.id ? <span className="w-3.5 h-3.5 border border-red-400/30 border-t-red-500 rounded-full animate-spin inline-block" /> : <i className="bi bi-trash3" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
                                        <h3 className="font-bold text-gray-900 mb-4 text-sm">Thêm ngày khởi hành</h3>
                                        <form onSubmit={handleAddDeparture} className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày khởi hành *</label>
                                                <input type="date" min={new Date().toISOString().split("T")[0]}
                                                    value={departureForm.departureDate} onChange={e => setDepartureForm(f => ({ ...f, departureDate: e.target.value }))}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Số slot</label>
                                                <input type="number" min="1" value={departureForm.availableSlots}
                                                    onChange={e => setDepartureForm(f => ({ ...f, availableSlots: e.target.value }))}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                            <button type="submit" disabled={subSaving}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                                                {subSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><i className="bi bi-plus-lg" /> Thêm ngày</>}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Images */}
                        {detailTab === "images" && (
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                                <div className="lg:col-span-3">
                                    {detailTour.images?.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
                                            <i className="bi bi-images text-3xl block mb-2" />Chưa có hình ảnh
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {detailTour.images?.map((img) => (
                                                <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-gray-100">
                                                    <img src={`data:image/jpeg;base64,${img.photo}`} alt=""
                                                        className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => handleDeleteImage(img.id)}
                                                        disabled={deletingSubId === img.id}
                                                        className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:opacity-60"
                                                    >
                                                        {deletingSubId === img.id
                                                            ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                                            : <i className="bi bi-trash3 text-xs" />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
                                        <h3 className="font-bold text-gray-900 mb-4 text-sm">Thêm hình ảnh</h3>
                                        <form onSubmit={handleUploadImage} className="space-y-3">
                                            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/20 transition-all">
                                                {imageFile ? (
                                                    <img src={URL.createObjectURL(imageFile)} alt="" className="w-full h-32 object-cover rounded-lg" />
                                                ) : (
                                                    <><i className="bi bi-cloud-upload text-3xl text-gray-400" /><span className="text-sm text-gray-500">Chọn ảnh PNG/JPG</span></>
                                                )}
                                                <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0])} />
                                            </label>
                                            <button type="submit" disabled={subSaving || !imageFile}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                                                {subSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><i className="bi bi-upload" /> Tải lên</>}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // ── List view ────────────────────────────────────────────────
    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tour..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <button onClick={openAdd}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shrink-0">
                    <i className="bi bi-plus-circle" /> Thêm tour
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                    { label: "Tổng", value: tours.length, icon: "bi-compass", color: "text-emerald-600 bg-emerald-50" },
                    { label: "Hoạt động", value: tours.filter(t => t.status === "ACTIVE").length, icon: "bi-check-circle", color: "text-blue-600 bg-blue-50" },
                    { label: "Tạm đóng", value: tours.filter(t => t.status !== "ACTIVE").length, icon: "bi-pause-circle", color: "text-amber-600 bg-amber-50" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}><i className={`bi ${s.icon}`} /></div>
                        <div><p className="text-lg font-black text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <i className="bi bi-compass text-4xl text-gray-300 block mb-2" /><p className="text-gray-500">Không tìm thấy tour</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 text-left">Tour</th>
                                    <th className="px-5 py-3 text-left">Loại</th>
                                    <th className="px-5 py-3 text-left">Thời lượng</th>
                                    <th className="px-5 py-3 text-left">Giá người lớn</th>
                                    <th className="px-5 py-3 text-left">Ngày KH</th>
                                    <th className="px-5 py-3 text-left">Trạng thái</th>
                                    <th className="px-5 py-3 text-left">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(tour => (
                                    <tr key={tour.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-900 text-sm">{tour.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{tour.destination}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TOUR_TYPE_COLOR[tour.tourType] || "bg-gray-100 text-gray-600"}`}>
                                                {TOUR_TYPE_LABEL[tour.tourType] || tour.tourType}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{tour.durationDays} ngày</td>
                                        <td className="px-5 py-4 text-sm font-semibold text-emerald-700">
                                            {Number(tour.priceAdult).toLocaleString("vi-VN")} ₫
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{tour.totalDepartures || 0}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[tour.status] || "bg-gray-100 text-gray-500"}`}>
                                                {STATUS_LABEL[tour.status] || tour.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openDetail(tour)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Quản lý chi tiết">
                                                    <i className="bi bi-list-ul" />
                                                </button>
                                                <button onClick={() => navigate(`/tours/${tour.id}`)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Xem trang">
                                                    <i className="bi bi-eye" />
                                                </button>
                                                <button onClick={() => openEdit(tour)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Chỉnh sửa">
                                                    <i className="bi bi-pencil" />
                                                </button>
                                                <button onClick={() => handleDelete(tour)} disabled={deletingId === tour.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50" title="Xoá">
                                                    {deletingId === tour.id ? <span className="w-3.5 h-3.5 border border-red-400/30 border-t-red-500 rounded-full animate-spin inline-block" /> : <i className="bi bi-trash3" />}
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
        </div>
    )
}

export default TourManagement
