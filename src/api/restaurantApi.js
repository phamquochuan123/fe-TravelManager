import axiosInstance from "./axiosInstance"

export const getAllRestaurants = (city = null, admin = false) => {
    const params = new URLSearchParams()
    if (admin) params.append("admin", "true")
    if (city) params.append("city", city)
    return axiosInstance.get(`/restaurants?${params}`).then(r => r.data)
}

export const getRestaurantById = (id) =>
    axiosInstance.get(`/restaurants/${id}`).then(r => r.data)

export const createRestaurant = (data) =>
    axiosInstance.post("/restaurants", data).then(r => r.data)

export const updateRestaurant = (id, data) =>
    axiosInstance.put(`/restaurants/${id}`, data).then(r => r.data)

export const deleteRestaurant = (id) =>
    axiosInstance.delete(`/restaurants/${id}`)

export const toggleRestaurantActive = (id) =>
    axiosInstance.patch(`/restaurants/${id}/active`).then(r => r.data)

export const uploadRestaurantPhoto = (id, file) => {
    const fd = new FormData()
    fd.append("photo", file)
    return axiosInstance.patch(`/restaurants/${id}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
    }).then(r => r.data)
}

// Booking
export const bookRestaurant = (restaurantId, data) =>
    axiosInstance.post(`/restaurants/${restaurantId}/bookings`, data).then(r => r.data)

export const getMyRestaurantBookings = () =>
    axiosInstance.get("/restaurants/bookings/my").then(r => r.data)

export const getAllRestaurantBookings = () =>
    axiosInstance.get("/restaurants/bookings/all").then(r => r.data)

export const updateRestaurantBookingStatus = (bookingId, status) =>
    axiosInstance.patch(`/restaurants/bookings/${bookingId}/status?status=${status}`).then(r => r.data)

export const cancelRestaurantBooking = (bookingId) =>
    axiosInstance.patch(`/restaurants/bookings/${bookingId}/cancel`).then(r => r.data)
