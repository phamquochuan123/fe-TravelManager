import React from 'react'

const RoomFilter = ({ data, setFilteredData }) => {
    const [filter, setFilter] = useState("")
    const handleSelectChange = (e) => {
        const selectedRoomType = e.target.value
        setFilter(selectedRoomType)
        const filteredRooms = data.filter((room) => room.roomType.toLowerCase()
            .includes(selectedRoomType.toLowerCase()))
        setFilteredData(filteredRooms)
    }
    const clearFilter = () => {
        setFilter("")
        setFilteredData(data)
    }
    const roomTypes = ["", ... new Set(data.map((room) => room.roomType))]
    return (
        <div className="input-group mb-3">
            <span className="input-group-text" id="room-type-filter">
                Filter room by type
            </span>
        </div >
    )
}

export default RoomFilter