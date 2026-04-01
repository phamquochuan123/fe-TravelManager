import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoomById, updateRoom, getRoomTypes } from '../../util/ApiFuntions'

const EditRoom = () => {
    const { roomId } = useParams()
    const navigate = useNavigate()

    const [roomTypes, setRoomTypes] = useState([])
    const [roomData, setRoomData] = useState({ roomType: '', roomPrice: '', photo: null })
    const [photoPreview, setPhotoPreview] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [room, types] = await Promise.all([getRoomById(roomId), getRoomTypes()])
                setRoomData({ roomType: room.roomType, roomPrice: room.roomPrice, photo: null })
                if (room.photo) {
                    setPhotoPreview(`data:image/jpeg;base64,${room.photo}`)
                }
                setRoomTypes(types)
            } catch (error) {
                setErrorMessage(error.message)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [roomId])

    const handleChange = (e) => {
        const { name, value } = e.target
        setRoomData((prev) => ({ ...prev, [name]: value }))
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setRoomData((prev) => ({ ...prev, photo: file }))
            setPhotoPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await updateRoom(roomId, roomData)
            setSuccessMessage('Room updated successfully!')
            setTimeout(() => navigate(-1), 1500)
        } catch (error) {
            setErrorMessage(error.message)
            setTimeout(() => setErrorMessage(null), 3000)
        }
    }

    if (isLoading) return <p className="text-center mt-5">Loading room...</p>

    return (
        <section className="container mt-5 mb-5" style={{ maxWidth: 600 }}>
            <h2 className="text-center mb-4">Edit Room</h2>

            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Room Type</label>
                    <select
                        name="roomType"
                        className="form-select"
                        value={roomData.roomType}
                        onChange={handleChange}
                        required
                    >
                        <option value="">-- Select room type --</option>
                        {roomTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Room Price</label>
                    <input
                        type="number"
                        name="roomPrice"
                        className="form-control"
                        value={roomData.roomPrice}
                        onChange={handleChange}
                        min={0}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Room Photo</label>
                    {photoPreview && (
                        <img
                            src={photoPreview}
                            alt="Room preview"
                            className="d-block mb-2 img-thumbnail"
                            style={{ maxHeight: 200, objectFit: 'cover' }}
                        />
                    )}
                    <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handlePhotoChange}
                    />
                </div>

                <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-warning">Update Room</button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
                </div>
            </form>
        </section>
    )
}

export default EditRoom
