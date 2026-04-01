import React from 'react'
import { Link } from 'react-router-dom'

const RoomCard = ({ room }) => {
    return (
        <div className='col-12 mb-4'>
            <div className='card'>
                <div className='card-body d-flex flex-wrap align-items-center'>
                    <div className='flex-shrink-0 mr-3 mb-3 mb-md-0'>
                        <img
                            src={`data:image/png;base64,${room.photo}`}
                            alt='Room photo'
                            style={{ width: 150, height: "200px", objectFit: 'cover' }}
                        />
                    </div>
                    <div className='flex-grow-1 ml-3 px-5'>
                        <h5 className='card-title hotel-color'>{room.roomType}</h5>
                        <h5 className='card-title room-color'>{room.roomPrice}</h5>
                        <p className='card-text'>Some room information goes here for the guest to read through</p>
                    </div>
                    <div className='flex-shrink-0 mt-3'>
                        <Link to={`/bookings/${room.id}`} className='btn btn-hotel btn-sm'>
                            Book Now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RoomCard
