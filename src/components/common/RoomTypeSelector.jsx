import { useEffect, useState } from 'react'
import { getRoomTypes } from '../../util/ApiFuntions'

const RoomTypeSelector = ({ handleNewRoomInputChange, newRoom }) => {
    const [roomTypes, setRoomTypes] = useState([])
    const [showNewRoomtypeInput, setShowNewRoomTypeInput] = useState(false)
    const [newRoomType, setNewRoomType] = useState("")

    useEffect(() => {
        getRoomTypes().then((data) => {
            setRoomTypes(data)
        })
    }, [])

    const handleNewRoomTypeInputChange = (e) => {
        setNewRoomType(e.target.value)
    }

    const handleAddNewRoomType = () => {
        if (newRoomType !== "") {
            setRoomTypes([...roomTypes, newRoomType])
            setNewRoomType("")
            setShowNewRoomTypeInput(false)
        }
    }

    return (
        <>
            <select
                name="roomType"
                value={newRoom.roomType}
                onChange={(e) => {
                    if (e.target.value === "Add New") {
                        setShowNewRoomTypeInput(true)
                    } else {
                        setShowNewRoomTypeInput(false)
                        handleNewRoomInputChange(e)
                    }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <option value="">Chọn loại phòng</option>
                <option value="Add New">+ Thêm loại phòng mới</option>
                {roomTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                ))}
            </select>

            {showNewRoomtypeInput && (
                <div className="flex gap-2 mt-2">
                    <input
                        type="text"
                        placeholder="Nhập loại phòng mới"
                        value={newRoomType}
                        onChange={handleNewRoomTypeInputChange}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="button"
                        onClick={handleAddNewRoomType}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        Thêm
                    </button>
                </div>
            )}
        </>
    )
}

export default RoomTypeSelector
