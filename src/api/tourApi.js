import axiosInstance from "./axiosInstance"

export const getAllTours = (admin = false) =>
    axiosInstance.get(`/tours${admin ? "?admin=true" : ""}`).then(r => r.data)

export const getTourById = (id) =>
    axiosInstance.get(`/tours/${id}`).then(r => r.data)

export const createTour = (data) =>
    axiosInstance.post("/tours", data).then(r => r.data)

export const updateTour = (id, data) =>
    axiosInstance.put(`/tours/${id}`, data).then(r => r.data)

export const deleteTour = (id) =>
    axiosInstance.delete(`/tours/${id}`)

export const addTourImage = (tourId, file) => {
    const fd = new FormData()
    fd.append("file", file)
    return axiosInstance.post(`/tours/${tourId}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
    })
}

export const addTourItinerary = (tourId, data) =>
    axiosInstance.post(`/tours/${tourId}/itineraries`, data).then(r => r.data)

export const updateTourItinerary = (tourId, itineraryId, data) =>
    axiosInstance.put(`/tours/${tourId}/itineraries/${itineraryId}`, data).then(r => r.data)

export const deleteTourItinerary = (tourId, itineraryId) =>
    axiosInstance.delete(`/tours/${tourId}/itineraries/${itineraryId}`)

export const addTourDeparture = (tourId, data) =>
    axiosInstance.post(`/tours/${tourId}/departures`, data).then(r => r.data)

export const deleteTourDeparture = (tourId, departureId) =>
    axiosInstance.delete(`/tours/${tourId}/departures/${departureId}`)

export const deleteTourImage = (tourId, imageId) =>
    axiosInstance.delete(`/tours/${tourId}/images/${imageId}`)

// Booking
export const bookTour = (tourId, data) =>
    axiosInstance.post(`/tour-bookings/tours/${tourId}`, data).then(r => r.data)

export const getMyTourBookings = () =>
    axiosInstance.get("/tour-bookings/my").then(r => r.data)

export const getAllTourBookings = () =>
    axiosInstance.get("/tour-bookings/all").then(r => r.data)

export const updateTourBookingStatus = (bookingId, status) =>
    axiosInstance.patch(`/tour-bookings/${bookingId}/status?status=${status}`).then(r => r.data)

export const cancelTourBooking = (bookingId) =>
    axiosInstance.patch(`/tour-bookings/${bookingId}/cancel`).then(r => r.data)

// Reviews
export const getTourReviews = (tourId) =>
    axiosInstance.get(`/tours/${tourId}/reviews`).then(r => r.data)

export const createTourReview = (tourId, data) =>
    axiosInstance.post(`/tours/${tourId}/reviews`, data).then(r => r.data)

export const deleteTourReview = (tourId, reviewId) =>
    axiosInstance.delete(`/tours/${tourId}/reviews/${reviewId}`)

// Coupons
export const getAllCoupons = () =>
    axiosInstance.get("/tour-coupons").then(r => r.data)

export const createCoupon = (data) =>
    axiosInstance.post("/tour-coupons", data).then(r => r.data)

export const updateCoupon = (id, data) =>
    axiosInstance.put(`/tour-coupons/${id}`, data).then(r => r.data)

export const deleteCoupon = (id) =>
    axiosInstance.delete(`/tour-coupons/${id}`)

export const validateCoupon = (code, orderValue) =>
    axiosInstance.post("/tour-coupons/validate", { code, orderValue }).then(r => r.data)
