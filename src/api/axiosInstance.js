import axios from "axios"
import { toast } from "react-toastify"
import { useAuthStore, selectIsSessionExpiring } from "@/stores/authStore"

const SESSION_MAX_MS = 23 * 60 * 60 * 1000 // 23 hours

const api = axios.create({
    baseURL: "http://localhost:8081/api/v1",
    withCredentials: true,
    timeout: 30000, // 30s — sau đó báo lỗi thay vì treo mãi
})

const publicPaths = ['/login', '/register', '/forgot-password']

function redirectToLogin() {
    if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login'
    }
}

// Proactively redirect if login time is older than 23 hours
api.interceptors.request.use(config => {
    const state = useAuthStore.getState()
    if (selectIsSessionExpiring(state)) {
        useAuthStore.getState().logout()
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        redirectToLogin()
        return Promise.reject(new Error('Session expired'))
    }
    return config
})

// Trích xuất message lỗi từ response của Spring Boot
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout()
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
            redirectToLogin()
        }

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
