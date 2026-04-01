import { useState, useEffect } from 'react'
import { getAllRooms, deleteRoom } from '../../util/ApiFuntions'
import RoomFilter from '../common/RoomFilter'
import RoomPaginator from '../common/RoomPaginator'
import { FaEdit, FaEye, FaTrashAlt } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const ExistingRoom = () => {
    const [rooms, setRooms] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [roomsPerpage] = useState(8)
    const [isLoading, setLoading] = useState(false)
    const [filteredRooms, setFilteredRooms] = useState([])
    const [selectedRoomType, setSelectedRoomType] = useState("")
    const [errorMessage, setErrorMessage] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    useEffect(() => {
        fetchRooms()
    }, [])

    const fetchRooms = async () => {
        setLoading(true)
        try {
            const result = await getAllRooms()
            setRooms(result)
            setLoading(false)
        } catch (error) {
            setErrorMessage(error.message)
            setLoading(false)
        }
    }

    useEffect(() => {
        if (selectedRoomType === "") {
            setFilteredRooms(rooms)
        } else {
            const filtered = rooms.filter((room) => room.roomType === selectedRoomType)
            setFilteredRooms(filtered)
        }
        setCurrentPage(1)
    }, [rooms, selectedRoomType])

    const handlePaginationClick = (pageNumber) => {
        setCurrentPage(pageNumber)
    }

    const handleDelete = async (roomId) => {
        try {
            const result = await deleteRoom(roomId)
            if (result === "") {
                setSuccessMessage(`Room No ${roomId} was deleted`)
                fetchRooms()
            } else {
                console.error(`Error deleting room: ${result}`)
            }
        } catch (error) {
            setErrorMessage(error.message)
        } finally {
            setTimeout(() => {
                setSuccessMessage(null)
                setErrorMessage(null)
            }, 3000)
        }
    }

    const calculateTotalPages = (filteredRooms, roomsPerPage, rooms) => {
        const totalRooms = filteredRooms.length > 0 ? filteredRooms.length : rooms.length
        return Math.ceil(totalRooms / roomsPerPage)
    }

    const indexOfLastRoom = currentPage * roomsPerpage
    const indexOfFirstRoom = indexOfLastRoom - roomsPerpage
    const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom)

    return (
        <>
            {isLoading ? (
                <p>Loading existing rooms...</p>
            ) : (
                <>
                    <section className='mt-5 mb-5 container'>
                        <div className='d-flex justify-content-center mb-3 mt-5'>
                            <h2>Existing Rooms</h2>
                        </div>

                        <div className='col-md-6 mb-3 mb-md-0'>
                            <RoomFilter
                                data={rooms}
                                setFilteredData={setFilteredRooms}
                                setSelectedRoomType={setSelectedRoomType}
                            />
                        </div>

                        {successMessage && <p className="text-success">{successMessage}</p>}
                        {errorMessage && <p className="text-danger">{errorMessage}</p>}

                        <table className='table table-bordered table-hover'>
                            <thead>
                                <tr className='text-center'>
                                    <th>ID</th>
                                    <th>Room Type</th>
                                    <th>Room Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {currentRooms.map((room) => (
                                    <tr key={room.id} className="text-center">
                                        <td>{room.id}</td>
                                        <td>{room.roomType}</td>
                                        <td>{room.roomPrice}</td>
                                        <td className="gap-2">
                                            <Link to={`/edit-room/${room.id}`}>
                                                <span className="btn btn-info btn-sm me-1">
                                                    <FaEye />
                                                </span>
                                                <span className="btn btn-warning btn-sm me-1">
                                                    <FaEdit />
                                                </span>
                                            </Link>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(room.id)}
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <RoomPaginator
                            currentPage={currentPage}
                            totalPages={calculateTotalPages(filteredRooms, roomsPerpage, rooms)}
                            onPageChange={handlePaginationClick}
                        />
                    </section>
                </>
            )}
        </>
    )
}

export default ExistingRoom
