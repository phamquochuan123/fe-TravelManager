import { useEffect, useState } from 'react'
import { getAllRooms } from '../../api/roomApi'

const RoomList = () => {
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        getAllRooms()
            .then(setRooms)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex justify-center items-center py-16">
            <span className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></span>
        </div>
    )

    if (error) return (
        <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium flex items-center gap-2">
            <i className="bi bi-exclamation-circle"></i>{error}
        </div>
    )

    if (rooms.length === 0) return (
        <div className="text-center py-16 text-gray-400">
            <i className="bi bi-door-open text-4xl mb-3 block"></i>
            <p className="text-sm font-medium">Chưa có phòng nào</p>
        </div>
    )

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    {room.photo ? (
                        <img
                            src={`data:image/jpeg;base64,${room.photo}`}
                            alt={room.roomType}
                            className="w-full h-48 object-cover"
                        />
                    ) : (
                        <div className="w-full h-48 bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center">
                            <i className="bi bi-image text-4xl text-indigo-300"></i>
                        </div>
                    )}
                    <div className="p-4">
                        <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full mb-2">
                            {room.roomType}
                        </span>
                        <p className="text-xl font-black text-gray-900">
                            {Number(room.roomPrice).toLocaleString("vi-VN")}
                            <span className="text-sm font-normal text-gray-400 ml-1">VNĐ / đêm</span>
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default RoomList
