import axios from "axios"
import { toast } from "react-toastify"
import { useAuthStore, selectIsSessionExpiring } from "@/stores/authStore"

const SESSION_MAX_MS = 10 * 60 * 60 * 1000 // 10 hours — phải khớp thời gian sống thật của JWT (JwtUtil.generateToken)

const api = axios.create({
    // Local dev: gọi thẳng backend ở 8081. Production (Docker): build với VITE_API_BASE_URL="/api/v1"
    // để trình duyệt gọi cùng-origin qua nginx, tránh gọi "localhost" của máy user.
    // Fallback là đường dẫn TƯƠNG ĐỐI, không phải localhost:8081.
    // Nếu quên truyền VITE_API_BASE_URL lúc docker build, fallback tuyệt đối sẽ khiến
    // bundle public gọi về localhost của MÁY NGƯỜI DÙNG — app chết mà không rõ nguyên nhân.
    // "/api/v1" luôn đúng khi chạy sau nginx proxy, và ở dev thì đi qua server.proxy của Vite.
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
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
        // skipAuthRedirect: 401 ở đây là trạng thái bình thường (VD: check /profile lúc chưa đăng nhập),
        // không phải phiên hết hạn thật sự, nên không toast/redirect.
        if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
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
