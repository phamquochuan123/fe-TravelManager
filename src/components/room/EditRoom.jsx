import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoomById, updateRoom, getRoomTypes } from '../../api/roomApi'
import { toast } from 'react-toastify'
import MenuBar from '../Menubar'

const EditRoom = () => {
    const { roomId } = useParams()
    const navigate = useNavigate()

    const [roomTypes, setRoomTypes] = useState([])
    const [roomData, setRoomData] = useState({ roomType: '', roomPrice: '', photo: null })
    const [photoPreview, setPhotoPreview] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        Promise.all([getRoomById(roomId), getRoomTypes()])
            .then(([room, types]) => {
                setRoomData({ roomType: room.roomType, roomPrice: room.roomPrice, photo: null })
                if (room.photo) setPhotoPreview(`data:image/jpeg;base64,${room.photo}`)
                setRoomTypes(types)
            })
            .catch(e => toast.error(e.message))
            .finally(() => setIsLoading(false))
    }, [roomId])

    const handleChange = (e) => {
        const { name, value } = e.target
        setRoomData(prev => ({ ...prev, [name]: value }))
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setRoomData(prev => ({ ...prev, photo: file }))
            setPhotoPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await updateRoom(roomId, roomData)
            toast.success('Cập nhật phòng thành công!')
            setTimeout(() => navigate(-1), 1200)
        } catch (error) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    if (isLoading) return (
        <div className="min-h-screen bg-gray-50 font-['Outfit'] flex items-center justify-center">
            <MenuBar />
            <span className="w-10 h-10 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="pt-24 pb-12 px-6 max-w-xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-6 transition-colors"
                >
                    <i className="bi bi-arrow-left" /> Quay lại
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <i className="bi bi-pencil-square text-indigo-500" /> Chỉnh sửa phòng
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại phòng</label>
                            <select
                                name="roomType"
                                value={roomData.roomType}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- Chọn loại phòng --</option>
                                {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá phòng (₫/đêm)</label>
                            <input
                                type="number"
                                name="roomPrice"
                                value={roomData.roomPrice}
                                onChange={handleChange}
                                min={0}
                                required
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ảnh phòng</label>
                            {photoPreview && (
                                <img
                                    src={photoPreview}
                                    alt="Preview"
                                    className="mb-3 rounded-xl object-cover w-full max-h-52"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {saving
                                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</>
                                    : <><i className="bi bi-floppy" /> Lưu thay đổi</>
                                }
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                Huỷ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default EditRoom
