import { useEffect, useState, useContext } from "react"
import { AppContext } from "../context/AppContext"
import axiosInstance from "../api/axiosInstance"
import MenuBar from "../components/Menubar"
import { toast } from "react-toastify"

const UserProfile = () => {
    const { userData, getUserData } = useContext(AppContext)
    const [editMode, setEditMode] = useState(false)
    const [form, setForm] = useState({ name: "", email: "" })
    const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
    const [saving, setSaving] = useState(false)
    const [changingPw, setChangingPw] = useState(false)
    const [pwErrors, setPwErrors] = useState({})
    const [showPwSection, setShowPwSection] = useState(false)
    const [showPw, setShowPw] = useState({ currentPassword: false, newPassword: false, confirmPassword: false })

    useEffect(() => {
        if (userData) {
            setForm({ name: userData.name || "", email: userData.email || "" })
        }
    }, [userData])

    const handleSaveProfile = async e => {
        e.preventDefault()
        if (!form.name.trim()) { toast.error("Tên không được để trống"); return }
        setSaving(true)
        try {
            await axiosInstance.put("/profile", { name: form.name })
            await getUserData()
            setEditMode(false)
            toast.success("Cập nhật hồ sơ thành công!")
        } catch (err) {
            toast.error(err.response?.data?.message || "Không thể cập nhật hồ sơ")
        } finally {
            setSaving(false)
        }
    }

    const validatePw = () => {
        const e = {}
        if (!pwForm.currentPassword) e.currentPassword = "Nhập mật khẩu hiện tại"
        if (!pwForm.newPassword || pwForm.newPassword.length < 8) e.newPassword = "Mật khẩu mới tối thiểu 8 ký tự"
        if (pwForm.newPassword !== pwForm.confirmPassword) e.confirmPassword = "Mật khẩu xác nhận không khớp"
        return e
    }

    const handleChangePw = async e => {
        e.preventDefault()
        const errs = validatePw()
        if (Object.keys(errs).length) { setPwErrors(errs); return }
        setChangingPw(true)
        try {
            await axiosInstance.post("/profile/change-password", {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
            })
            setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
            setShowPwSection(false)
            toast.success("Đổi mật khẩu thành công!")
        } catch (err) {
            toast.error(err.response?.data?.message || "Mật khẩu hiện tại không đúng")
        } finally {
            setChangingPw(false)
        }
    }

    const roleLabel = { ADMIN: "Quản trị viên", STAFF: "Nhân viên", USER: "Khách hàng" }
    const roleIcon = { ADMIN: "bi-shield-fill", STAFF: "bi-person-badge-fill", USER: "bi-person-fill" }
    const role = userData?.role?.name || "USER"

    const pwFields = [
        { name: "currentPassword", label: "Mật khẩu hiện tại", icon: "bi-lock" },
        { name: "newPassword", label: "Mật khẩu mới (tối thiểu 8 ký tự)", icon: "bi-key" },
        { name: "confirmPassword", label: "Xác nhận mật khẩu mới", icon: "bi-check-circle" },
    ]

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />

            {/* Hero banner */}
            <div className="bg-gradient-to-br from-sky-600 via-blue-700 to-cyan-600 pt-24 pb-16 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="relative z-10 max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-6">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-5xl font-black text-white shadow-2xl">
                            {userData?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        {userData?.isAccountVerified && (
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                <i className="bi bi-check-lg text-white text-sm" />
                            </div>
                        )}
                    </div>
                    <div className="text-center sm:text-left pb-1">
                        <h1 className="text-3xl font-black text-white mb-1">{userData?.name || "—"}</h1>
                        <p className="text-white/70 text-sm mb-3 flex items-center justify-center sm:justify-start gap-1.5">
                            <i className="bi bi-envelope" /> {userData?.email}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white">
                                <i className={`bi ${roleIcon[role]}`} /> {roleLabel[role] || role}
                            </span>
                            {userData?.isAccountVerified && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 backdrop-blur-sm border border-emerald-300/40 text-white">
                                    <i className="bi bi-patch-check-fill" /> Đã xác thực
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 -mt-4 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Sidebar */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="font-bold text-gray-900 mb-4 text-sm">Tài khoản</h3>
                            <div className="space-y-3">
                                {[
                                    { icon: "bi-person", label: "Họ tên", value: userData?.name },
                                    { icon: "bi-envelope", label: "Email", value: userData?.email },
                                    { icon: "bi-shield-check", label: "Vai trò", value: roleLabel[role] || role },
                                ].map(item => (
                                    <div key={item.label} className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                            <i className={`bi ${item.icon} text-sky-500 text-sm`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-400">{item.label}</p>
                                            <p className="font-semibold text-gray-800 text-sm truncate">{item.value || "—"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={`rounded-2xl p-4 border ${userData?.isAccountVerified ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${userData?.isAccountVerified ? "bg-emerald-100" : "bg-amber-100"}`}>
                                    <i className={`bi ${userData?.isAccountVerified ? "bi-patch-check-fill text-emerald-600" : "bi-exclamation-circle text-amber-600"}`} />
                                </div>
                                <div>
                                    <p className={`text-xs font-bold ${userData?.isAccountVerified ? "text-emerald-700" : "text-amber-700"}`}>
                                        {userData?.isAccountVerified ? "Đã xác thực" : "Chưa xác thực"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {userData?.isAccountVerified ? "Email đã được xác nhận" : "Vui lòng xác thực email"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Profile info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                    <i className="bi bi-person-circle text-sky-500" /> Thông tin cá nhân
                                </h2>
                                {!editMode && (
                                    <button onClick={() => setEditMode(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-600 text-sm font-semibold rounded-xl transition-colors">
                                        <i className="bi bi-pencil" /> Chỉnh sửa
                                    </button>
                                )}
                            </div>

                            {editMode ? (
                                <form onSubmit={handleSaveProfile} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><i className="bi bi-person" /></span>
                                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                                                placeholder="Nhập họ và tên" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"><i className="bi bi-envelope" /></span>
                                            <input value={form.email} disabled className="w-full border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1"><i className="bi bi-info-circle" /> Email không thể thay đổi</p>
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                        <button type="submit" disabled={saving}
                                            className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-60 shadow-md shadow-sky-200">
                                            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</> : <><i className="bi bi-check-lg" /> Lưu thay đổi</>}
                                        </button>
                                        <button type="button" onClick={() => { setEditMode(false); setForm({ name: userData?.name || "", email: userData?.email || "" }) }}
                                            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                                            Hủy
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-3">
                                    {[
                                        { label: "Họ và tên", value: userData?.name, icon: "bi-person" },
                                        { label: "Email", value: userData?.email, icon: "bi-envelope" },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                            <div className="w-9 h-9 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                                                <i className={`bi ${item.icon} text-sky-500`} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">{item.label}</p>
                                                <p className="font-semibold text-gray-900 text-sm">{item.value || "—"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Change password */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                    <i className="bi bi-shield-lock text-sky-500" /> Bảo mật
                                </h2>
                                <button onClick={() => setShowPwSection(s => !s)}
                                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${showPwSection ? "bg-gray-100 hover:bg-gray-200 text-gray-700" : "bg-sky-50 hover:bg-sky-100 text-sky-600"}`}>
                                    <i className={`bi bi-chevron-${showPwSection ? "up" : "down"}`} />
                                    {showPwSection ? "Ẩn" : "Đổi mật khẩu"}
                                </button>
                            </div>

                            {!showPwSection ? (
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                                        <i className="bi bi-lock-fill text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Mật khẩu</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Được mã hóa và bảo vệ an toàn</p>
                                    </div>
                                    <div className="ml-auto flex gap-1">
                                        {[...Array(8)].map((_, i) => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleChangePw} className="space-y-4">
                                    {pwFields.map(field => (
                                        <div key={field.name}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                                    <i className={`bi ${field.icon}`} />
                                                </span>
                                                <input
                                                    type={showPw[field.name] ? "text" : "password"}
                                                    value={pwForm[field.name]}
                                                    onChange={e => { setPwForm(f => ({ ...f, [field.name]: e.target.value })); setPwErrors(err => ({ ...err, [field.name]: "" })) }}
                                                    className={`w-full border ${pwErrors[field.name] ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-sky-400"} rounded-xl pl-9 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                                                    placeholder={field.label}
                                                />
                                                <button type="button"
                                                    onClick={() => setShowPw(s => ({ ...s, [field.name]: !s[field.name] }))}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sky-500">
                                                    <i className={`bi ${showPw[field.name] ? "bi-eye-slash" : "bi-eye"}`} />
                                                </button>
                                            </div>
                                            {pwErrors[field.name] && (
                                                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                                    <i className="bi bi-exclamation-circle" /> {pwErrors[field.name]}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex gap-3 pt-1">
                                        <button type="submit" disabled={changingPw}
                                            className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-60 shadow-md shadow-sky-200">
                                            {changingPw ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</> : <><i className="bi bi-shield-check" /> Đổi mật khẩu</>}
                                        </button>
                                        <button type="button" onClick={() => { setShowPwSection(false); setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setPwErrors({}) }}
                                            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                                            Hủy
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserProfile
