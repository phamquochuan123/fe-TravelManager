import api from "./axiosInstance"

export async function getRoomsByHotelId(hotelId) {
    const response = await api.get(`/hotels/${hotelId}/rooms`)
    return response.data
}

export async function addRoomToHotel(hotelId, roomData) {
    const formData = new FormData()
    formData.append("roomType", roomData.roomType)
    formData.append("roomPrice", roomData.roomPrice)
    if (roomData.roomNumber) formData.append("roomNumber", roomData.roomNumber)
    formData.append("maxGuests", roomData.maxGuests ?? 2)
    formData.append("numBeds", roomData.numBeds ?? 1)
    if (roomData.area) formData.append("area", roomData.area)
    if (roomData.description) formData.append("description", roomData.description)
    if (roomData.photo) formData.append("photo", roomData.photo)
    const response = await api.post(`/hotels/${hotelId}/rooms`, formData)
    return response.data
}

export async function deleteRoomFromHotel(hotelId, roomId) {
    await api.delete(`/hotels/${hotelId}/rooms/${roomId}`)
}
