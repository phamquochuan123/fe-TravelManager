import axiosInstance from "./axiosInstance"

export const getAllDestinations = (city = null, admin = false) => {
    const params = new URLSearchParams()
    if (admin) params.append("admin", "true")
    if (city) params.append("city", city)
    return axiosInstance.get(`/destinations?${params}`).then(r => r.data)
}

export const getDestinationById = (id) =>
    axiosInstance.get(`/destinations/${id}`).then(r => r.data)

export const createDestination = (data) =>
    axiosInstance.post("/destinations", data).then(r => r.data)

export const updateDestination = (id, data) =>
    axiosInstance.put(`/destinations/${id}`, data).then(r => r.data)

export const deleteDestination = (id) =>
    axiosInstance.delete(`/destinations/${id}`)

export const toggleDestinationActive = (id) =>
    axiosInstance.patch(`/destinations/${id}/active`).then(r => r.data)

export const uploadDestinationPhoto = (id, file) => {
    const fd = new FormData()
    fd.append("photo", file)
    return axiosInstance.patch(`/destinations/${id}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
    }).then(r => r.data)
}
