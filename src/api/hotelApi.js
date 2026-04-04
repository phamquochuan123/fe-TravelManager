import api from "./axiosInstance"

export async function getAllHotels(city = null) {
    const params = city ? { city } : {}
    const response = await api.get("/hotels", { params })
    return response.data
}

export async function getAllHotelsAdmin() {
    const response = await api.get("/hotels", { params: { admin: true } })
    return response.data
}

export async function getHotelById(hotelId) {
    const response = await api.get(`/hotels/${hotelId}`)
    return response.data
}

export async function createHotel(hotelData) {
    const response = await api.post("/hotels", hotelData)
    return response.data
}

export async function updateHotel(hotelId, hotelData) {
    const response = await api.put(`/hotels/${hotelId}`, hotelData)
    return response.data
}

export async function deleteHotel(hotelId) {
    await api.delete(`/hotels/${hotelId}`)
}

export async function toggleHotelActive(hotelId) {
    const response = await api.patch(`/hotels/${hotelId}/active`)
    return response.data
}

export async function uploadHotelPhoto(hotelId, file) {
    const formData = new FormData()
    formData.append("photo", file)
    const response = await api.patch(`/hotels/${hotelId}/photo`, formData)
    return response.data
}
