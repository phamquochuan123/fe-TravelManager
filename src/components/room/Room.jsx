import React, { useState, useEffect } from 'react'
import { getAllRooms } from '../../api/roomApi'
import RoomCard from './RoomCard'
import RoomFilter from '../common/RoomFilter'
import RoomPaginator from '../common/RoomPaginator'

const Room = () => {
    const [data, setData] = useState([])
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [roomsPerPage] = useState(6)
    const [filteredData, setFilteredData] = useState([])

    useEffect(() => {
        setIsLoading(true)
        getAllRooms().then((data) => {
            setData(data)
            setFilteredData(data)
            setIsLoading(false)
        }).catch((error) => {
            setError(error.message)
            setIsLoading(false)
        })
    }, [])
    if (isLoading) {
        return <div>Loading rooms...</div>
    }
    if (error) {
        return <div className="text-danger">Error : {error} </div>
    }
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber)
    }

    const totalPages = Math.ceil(filteredData.length / roomsPerPage)
    const renderRooms = () => {
        const startIndex = (currentPage - 1) * roomsPerPage
        const endIndex = startIndex + roomsPerPage
        return filteredData.slice(startIndex, endIndex)
            .map((room) => <RoomCard key={room.id} room={room} />)
    }

    return (
        <div className="container">
            <div className="row">
                <div className="col-md-6 mb-3 mb-md-0">
                    <RoomFilter data={data} setFilteredData={setFilteredData} />
                </div>

                <div className="col-md-6 d-flex align-items-center justify-content-end">
                    <RoomPaginator
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>
            <div className="row">{renderRooms()}</div>
            <div className="row">
                <div className="col-md-6 d-flex align-items-center justify-content-end">
                    <RoomPaginator
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>
        </div>
    )
}

export default Room