import { useState, useEffect, useRef } from "react"
import { resolveBase64Image } from '../../lib/utils'
import { createHotel, updateHotel, uploadHotelPhoto } from "../../api/hotelApi"
import { toast } from "react-toastify"

const HOTEL_TYPES = ["HOTEL", "RESORT", "HOMESTAY"]
const HOTEL_TYPE_LABEL = { HOTEL: "Khách sạn", RESORT: "Resort", HOMESTAY: "Homestay" }

const COMMON_AMENITIES = [
    "Wifi miễn phí", "Hồ bơi", "Bãi đỗ xe", "Phòng gym", "Nhà hàng",
    "Bar", "Spa", "Phòng hội nghị", "Dịch vụ phòng", "Điều hoà",
    "Thang máy", "Giặt ủi", "Đưa đón sân bay"
]

const EMPTY_FORM = {
    name: "", description: "", address: "", city: "",
    starRating: 3, hotelType: "HOTEL", amenities: "", isActive: true,
}

const HotelForm = ({ hotel, onSuccess, onCancel }) => {
    const [form, setForm] = useState(hotel ? {
        ...hotel,
        isActive: hotel.active !== false,
        amenities: hotel.amenities ?? "",
    } : EMPTY_FORM)
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [selectedAmenities, setSelectedAmenities] = useState(
        hotel?.amenities ? hotel.amenities.split(",").map(a => a.trim()).filter(Boolean) : []
    )
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(
        hotel?.photo ? resolveBase64Image(hotel.photo, '') : null
    )
    const fileInputRef = useRef(null)

    useEffect(() => {
        setForm(f => ({ ...f, amenities: selectedAmenities.join(", ") }))
    }, [selectedAmenities])

    const toggleAmenity = (a) => {
        setSelectedAmenities(prev =>
            prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
        )
    }

    const handleChange = e => {
        const { name, value, type, checked } = e.target
        setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }))
        setErrors(errs => ({ ...errs, [name]: "" }))
    }

    const handlePhotoChange = e => {
        const file = e.target.files[0]
        if (!file) return
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }

    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = "Tên khách sạn không được trống"
        if (!form.city.trim()) e.city = "Thành phố không được trống"
        if (!form.hotelType) e.hotelType = "Chọn loại khách sạn"
        if (form.starRating < 1 || form.starRating > 5) e.starRating = "Số sao từ 1 đến 5"
        return e
    }

    const handleSubmit = async e => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }
        setSaving(true)
        try {
            const payload = {
                ...form,
                starRating: Number(form.starRating),
            }
            let result
            if (hotel?.id) {
                result = await updateHotel(hotel.id, payload)
                if (photoFile) await uploadHotelPhoto(hotel.id, photoFile)
                toast.success("Cập nhật khách sạn thành công!")
            } else {
                result = await createHotel(payload)
                if (photoFile) result = await uploadHotelPhoto(result.id, photoFile)
                toast.success("Tạo khách sạn thành công!")
            }
            onSuccess?.(result)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic info */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <i className="bi bi-building text-sky-500" /> Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Tên khách sạn <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Nhập tên khách sạn"
                            className={`w-full border ${errors.name ? "border-red-400" : "border-gray-200"} rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Loại <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="hotelType"
                            value={form.hotelType}
                            onChange={handleChange}
                            className={`w-full border ${errors.hotelType ? "border-red-400" : "border-gray-200"} rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500`}
                        >
                            {HOTEL_TYPES.map(t => (
                                <option key={t} value={t}>{HOTEL_TYPE_LABEL[t]}</option>
                            ))}
                        </select>
                        {errors.hotelType && <p className="text-red-500 text-xs mt-1">{errors.hotelType}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Số sao <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, starRating: s }))}
                                    className={`w-10 h-10 rounded transition-all font-bold text-sm ${Number(form.starRating) >= s ? "bg-amber-400 text-white shadow-sm" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        {errors.starRating && <p className="text-red-500 text-xs mt-1">{errors.starRating}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Thành phố <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            placeholder="Nhập tên thành phố"
                            className={`w-full border ${errors.city ? "border-red-400" : "border-gray-200"} rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500`}
                        />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Địa chỉ</label>
                        <input
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Địa chỉ cụ thể (không bắt buộc)"
                            className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Mô tả ngắn về khách sạn..."
                            className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Photo upload */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="bi bi-image text-sky-500" /> Ảnh đại diện
                </h3>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded p-6 flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/30 transition-all group relative overflow-hidden"
                    style={{ minHeight: 160 }}
                >
                    {photoPreview ? (
                        <>
                            <img
                                src={photoPreview}
                                alt="preview"
                                className="w-full max-h-48 object-cover rounded"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                <span className="text-white text-sm font-semibold flex items-center gap-2">
                                    <i className="bi bi-pencil" /> Đổi ảnh
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-14 h-14 bg-sky-100 rounded flex items-center justify-center mb-3 group-hover:bg-sky-200 transition-colors">
                                <i className="bi bi-cloud-upload text-2xl text-sky-500" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700">Nhấn để tải ảnh lên</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (tối đa 10MB)</p>
                        </>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                    />
                </div>
                {photoFile && (
                    <div className="flex items-center justify-between mt-2 bg-sky-50 rounded px-4 py-2">
                        <span className="text-xs text-sky-700 font-medium flex items-center gap-2">
                            <i className="bi bi-file-image" /> {photoFile.name}
                        </span>
                        <button
                            type="button"
                            onClick={() => { setPhotoFile(null); setPhotoPreview(hotel?.photo ? photoPreview : null) }}
                            className="text-sky-400 hover:text-red-500 transition-colors"
                        >
                            <i className="bi bi-x-lg text-xs" />
                        </button>
                    </div>
                )}
            </div>

            {/* Amenities */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="bi bi-stars text-sky-500" /> Tiện ích
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                    {COMMON_AMENITIES.map(a => (
                        <button
                            key={a}
                            type="button"
                            onClick={() => toggleAmenity(a)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedAmenities.includes(a)
                                ? "bg-sky-600 text-white border-sky-600"
                                : "bg-white text-gray-600 border-gray-200 hover:border-sky-300"
                                }`}
                        >
                            {selectedAmenities.includes(a) && <i className="bi bi-check mr-1.5" />}
                            {a}
                        </button>
                    ))}
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Hoặc nhập thêm (phân cách bằng dấu phẩy)</label>
                    <input
                        name="amenities"
                        value={form.amenities}
                        onChange={e => {
                            handleChange(e)
                            setSelectedAmenities(e.target.value.split(",").map(a => a.trim()).filter(Boolean))
                        }}
                        placeholder="Wifi miễn phí, Hồ bơi, Gym..."
                        className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="bi bi-toggle-on text-sky-500" /> Trạng thái
                </h3>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={form.isActive}
                            onChange={handleChange}
                            className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${form.isActive ? "bg-sky-600" : "bg-gray-300"}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-7" : "translate-x-1"}`} />
                        </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                        {form.isActive ? "Đang hoạt động" : "Tạm đóng"}
                    </span>
                </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</>
                    ) : (
                        <><i className={`bi ${hotel?.id ? "bi-pencil-square" : "bi-plus-circle"}`} />
                            {hotel?.id ? "Cập nhật" : "Tạo khách sạn & thêm phòng"}</>
                    )}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded transition-colors"
                    >
                        Huỷ
                    </button>
                )}
            </div>

            {!hotel?.id && (
                <p className="text-center text-xs text-gray-400">
                    <i className="bi bi-info-circle mr-1" />
                    Sau khi tạo, bạn sẽ được chuyển sang bước thêm phòng cho khách sạn này
                </p>
            )}
        </form>
    )
}

export default HotelForm
