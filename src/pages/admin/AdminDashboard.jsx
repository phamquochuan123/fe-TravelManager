import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api/axiosInstance";
import { AppContext } from "../../context/AppContext";
import AddRoom from "../../components/room/AddRoom";
import ExistingRoom from "../../components/room/ExistingRoom";
import HotelManagement from "../../components/hotel/HotelManagement";
import TourManagement from "../../components/tour/TourManagement";
import RestaurantManagement from "../../components/restaurant/RestaurantManagement";
import DestinationManagement from "../../components/destination/DestinationManagement";
import RoleManagement from "../../components/admin/RoleManagement";
import PermissionManagement from "../../components/admin/PermissionManagement";
import CouponManagement from "../../components/admin/CouponManagement";
import MenuBar from "../../components/Menubar";

const TABS = [
    { key: "users", icon: "bi-people-fill", label: "Người dùng", color: "text-sky-600", bg: "bg-sky-50" },
    { key: "hotels", icon: "bi-building-fill", label: "Khách sạn", color: "text-blue-600", bg: "bg-blue-50" },
    { key: "rooms", icon: "bi-door-open-fill", label: "Phòng", color: "text-cyan-600", bg: "bg-cyan-50" },
    { key: "tours", icon: "bi-compass-fill", label: "Tour", color: "text-emerald-600", bg: "bg-emerald-50" },
    { key: "restaurants", icon: "bi-shop", label: "Nhà hàng", color: "text-orange-600", bg: "bg-orange-50" },
    { key: "destinations", icon: "bi-geo-alt-fill", label: "Địa điểm", color: "text-teal-600", bg: "bg-teal-50" },
    { key: "roles", icon: "bi-shield-lock-fill", label: "Vai trò", color: "text-purple-600", bg: "bg-purple-50" },
    { key: "permissions", icon: "bi-key-fill", label: "Quyền hạn", color: "text-amber-600", bg: "bg-amber-50" },
    { key: "coupons", icon: "bi-tag-fill", label: "Mã giảm giá", color: "text-rose-600", bg: "bg-rose-50" },
];

const AdminDashboard = () => {
    const { userData } = useContext(AppContext);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("users");
    const [roomSubTab, setRoomSubTab] = useState("list");

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get("/admin/users");
            setUsers(res.data);
        } catch {
            toast.error("Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get("/admin/roles");
            setRoles(res.data);
        } catch {
            toast.error("Không thể tải danh sách vai trò");
        }
    };

    const handleAssignRole = async (userId, roleId) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { roleId: Number(roleId) });
            toast.success("Cập nhật vai trò thành công");
            fetchUsers();
        } catch {
            toast.error("Cập nhật vai trò thất bại");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Bạn có chắc muốn xoá người dùng này?")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success("Xoá người dùng thành công");
            fetchUsers();
        } catch {
            toast.error("Xoá người dùng thất bại");
        }
    };

    const activeTabInfo = TABS.find(t => t.key === activeTab);

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto pb-12">

                {/* Admin header banner */}
                <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                    <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-inner border border-white/30">
                                {userData?.name?.charAt(0).toUpperCase() || "A"}
                            </div>
                            <div>
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">ADMIN PANEL</p>
                                <h1 className="text-2xl font-black text-white">{userData?.name || "Admin"}</h1>
                                <p className="text-white/60 text-sm">{userData?.email}</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            {[
                                { label: "Người dùng", value: users.length },
                                { label: "Nhân viên", value: users.filter(u => u.roleName === "STAFF").length },
                                { label: "Đã xác thực", value: users.filter(u => u.isAccountVerified).length },
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <p className="text-3xl font-black text-white">{stat.value}</p>
                                    <p className="text-white/60 text-xs">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 items-start">
                    {/* Left sidebar */}
                    <aside className="w-56 shrink-0 sticky top-24">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phân mục</p>
                            </div>
                            <nav className="p-2 space-y-0.5">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                                            activeTab === tab.key
                                                ? `${tab.bg} ${tab.color}`
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                    >
                                        <i className={`bi ${tab.icon} text-sm ${activeTab === tab.key ? tab.color : "text-gray-400 group-hover:text-gray-500"}`}></i>
                                        <span className="flex-1 text-left">{tab.label}</span>
                                        {activeTab === tab.key && (
                                            <i className="bi bi-chevron-right text-xs opacity-50"></i>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {/* Section heading */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className={`w-10 h-10 ${activeTabInfo?.bg || "bg-sky-50"} rounded-xl flex items-center justify-center shrink-0`}>
                                <i className={`bi ${activeTabInfo?.icon} ${activeTabInfo?.color || "text-sky-600"} text-base`}></i>
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900">{activeTabInfo?.label}</h2>
                                <p className="text-xs text-gray-400">Quản lý {activeTabInfo?.label?.toLowerCase()}</p>
                            </div>
                        </div>

                        {activeTab === "hotels" && <HotelManagement />}
                        {activeTab === "tours" && <TourManagement />}
                        {activeTab === "restaurants" && <RestaurantManagement />}
                        {activeTab === "destinations" && <DestinationManagement />}
                        {activeTab === "roles" && <RoleManagement />}
                        {activeTab === "permissions" && <PermissionManagement />}
                        {activeTab === "coupons" && <CouponManagement />}

                        {activeTab === "rooms" && (
                            <div>
                                <div className="flex gap-2 mb-5">
                                    <button
                                        onClick={() => setRoomSubTab("list")}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${roomSubTab === "list" ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                                    >
                                        <i className="bi bi-list-ul"></i> Danh sách phòng
                                    </button>
                                    <button
                                        onClick={() => setRoomSubTab("add")}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${roomSubTab === "add" ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                                    >
                                        <i className="bi bi-plus-circle"></i> Thêm phòng
                                    </button>
                                </div>
                                {roomSubTab === "list" ? <ExistingRoom /> : <AddRoom />}
                            </div>
                        )}

                        {activeTab === "users" && (
                            <>
                                {/* Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {[
                                        { label: "Tổng người dùng", value: users.length, icon: "bi-people-fill", color: "text-sky-600", bg: "bg-sky-50" },
                                        { label: "Quản trị viên", value: users.filter(u => u.roleName === "ADMIN").length, icon: "bi-shield-check", color: "text-red-600", bg: "bg-red-50" },
                                        { label: "Nhân viên", value: users.filter(u => u.roleName === "STAFF").length, icon: "bi-person-badge-fill", color: "text-blue-600", bg: "bg-blue-50" },
                                        { label: "Đã xác thực", value: users.filter(u => u.isAccountVerified).length, icon: "bi-patch-check-fill", color: "text-emerald-600", bg: "bg-emerald-50" },
                                    ].map((stat) => (
                                        <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} shrink-0`}>
                                                <i className={`bi ${stat.icon} text-lg ${stat.color}`}></i>
                                            </div>
                                            <div>
                                                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                                                <p className="text-xs text-gray-500">{stat.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* User Table */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="text-base font-bold text-gray-900">Danh sách người dùng</h3>
                                        <span className="bg-sky-50 text-sky-600 text-xs font-bold px-3 py-1.5 rounded-full border border-sky-100">{users.length} người dùng</span>
                                    </div>

                                    {loading ? (
                                        <div className="flex justify-center items-center py-16">
                                            <span className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></span>
                                        </div>
                                    ) : users.length === 0 ? (
                                        <div className="text-center py-16">
                                            <i className="bi bi-people text-5xl text-gray-300 block mb-3"></i>
                                            <p className="text-gray-500">Chưa có người dùng</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-3.5 text-left">Người dùng</th>
                                                        <th className="px-6 py-3.5 text-left">Email</th>
                                                        <th className="px-6 py-3.5 text-left">Trạng thái</th>
                                                        <th className="px-6 py-3.5 text-left">Vai trò</th>
                                                        <th className="px-6 py-3.5 text-left">Hành động</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {users.map((user) => (
                                                        <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                                        {user.name?.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="font-semibold text-gray-900 text-sm">{user.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-500 text-sm">{user.email}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.isAccountVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                                    <i className={`bi ${user.isAccountVerified ? "bi-patch-check-fill" : "bi-exclamation-circle"} text-xs`}></i>
                                                                    {user.isAccountVerified ? "Đã xác thực" : "Chưa xác thực"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <select
                                                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                                                                    value={roles.find(r => r.name === user.roleName)?.id || ""}
                                                                    onChange={(e) => handleAssignRole(user.id, e.target.value)}
                                                                >
                                                                    {roles.length > 0 ? roles.map(r => (
                                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                                    )) : (
                                                                        <>
                                                                            <option value="">-- Chọn role --</option>
                                                                            <option value="">{user.roleName}</option>
                                                                        </>
                                                                    )}
                                                                </select>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    disabled={user.email === userData?.email}
                                                                    className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                                >
                                                                    <i className="bi bi-trash3"></i> Xoá
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
