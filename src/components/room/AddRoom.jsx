import { useState } from 'react'
import { createRoom } from '../../api/roomApi'
import RoomTypeSelector from './RoomTypeSelector'

const AddRoom = () => {
    const [newRoom, setNewRoom] = useState({
        photo: null,
        roomType: "",
        roomPrice: ""
    })
    const [imagePreview, setImagePreview] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [loading, setLoading] = useState(false)

    const handleRoomInputChange = (e) => {
        const name = e.target.name
        let value = e.target.value
        if (name === "roomPrice") {
            if (!isNaN(value)) {
                value = parseFloat(value)
            } else {
                value = ""
            }
        }
        setNewRoom({ ...newRoom, [name]: value })
    }

    const handleImageChange = (e) => {
        const selectImage = e.target.files[0]
        setNewRoom({ ...newRoom, photo: selectImage })
        setImagePreview(URL.createObjectURL(selectImage))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const success = await createRoom(newRoom.photo, newRoom.roomType, newRoom.roomPrice)
            if (success !== undefined) {
                setSuccessMessage("Thêm phòng mới thành công")
                setNewRoom({ photo: null, roomType: "", roomPrice: "" })
                setImagePreview("")
                setErrorMessage("")
            } else {
                setErrorMessage("Lỗi khi thêm phòng")
            }
        } catch (error) {
            setErrorMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
                <i className="bi bi-plus-circle mr-2 text-indigo-600"></i>Thêm phòng mới
            </h2>

            {successMessage && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium flex items-center gap-2">
                    <i className="bi bi-check-circle"></i>{successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium flex items-center gap-2">
                    <i className="bi bi-exclamation-circle"></i>{errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại phòng</label>
                    <RoomTypeSelector
                        handleNewRoomInputChange={handleRoomInputChange}
                        newRoom={newRoom}
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá phòng</label>
                    <input
                        required
                        type="number"
                        name="roomPrice"
                        placeholder="Nhập giá phòng"
                        value={newRoom.roomPrice}
                        onChange={handleRoomInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ảnh phòng</label>
                    <input
                        required
                        type="file"
                        name="photo"
                        onChange={handleImageChange}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                    />
                    {imagePreview && (
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="mt-3 rounded-xl object-cover w-full max-h-52"
                        />
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Đang lưu...
                        </span>
                    ) : (
                        <><i className="bi bi-floppy mr-2"></i>Lưu phòng</>
                    )}
                </button>
            </form>
        </div>
    )
}

export default AddRoom
