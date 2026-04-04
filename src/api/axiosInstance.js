import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:8080/api/v1",
    withCredentials: true,
})

// Trích xuất message lỗi từ response của Spring Boot
api.interceptors.response.use(
    response => response,
    error => {
        const serverMessage =
            error.response?.data?.message ||
            error.response?.data ||
            error.message ||
            "Đã có lỗi xảy ra"
        return Promise.reject(new Error(
            typeof serverMessage === "string" ? serverMessage : JSON.stringify(serverMessage)
        ))
    }
)

export default api
