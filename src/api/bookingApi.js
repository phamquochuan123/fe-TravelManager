import api from "./axiosInstance"

export async function bookRoom(hotelId, roomId, bookingData) {
    const response = await api.post(`/hotels/${hotelId}/rooms/${roomId}/bookings`, bookingData)
    return response.data
}

export async function getBookingsByEmail(email) {
    const response = await api.get(`/bookings/guest/${email}`)
    return response.data
}

export async function getBookingByCode(confirmationCode) {
    const response = await api.get(`/bookings/confirmation/${confirmationCode}`)
    return response.data
}

export async function cancelBooking(bookingId) {
    await api.delete(`/bookings/${bookingId}`)
}
