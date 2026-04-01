import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
import AddRoom from "../../components/room/AddRoom";
import ExistingRoom from "../../components/room/ExistingRoom";
import MenuBar from "../../components/Menubar";

const AdminDashboard = () => {
    const { backend_Url, userData } = useContext(AppContext);
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
            const res = await axios.get(`${backend_Url}/admin/users`);
            setUsers(res.data);
        } catch {
            toast.error("Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await axios.get(`${backend_Url}/admin/roles`);
            setRoles(res.data);
        } catch {
            toast.error("Không thể tải danh sách vai trò");
        }
    };

    const handleAssignRole = async (userId, roleId) => {
        try {
            await axios.put(`${backend_Url}/admin/users/${userId}/role`, { roleId: Number(roleId) });
            toast.success("Cập nhật vai trò thành công");
            fetchUsers();
        } catch {
            toast.error("Cập nhật vai trò thất bại");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Bạn có chắc muốn xoá người dùng này?")) return;
        try {
            await axios.delete(`${backend_Url}/admin/users/${userId}`);
            toast.success("Xoá người dùng thành công");
            fetchUsers();
        } catch {
            toast.error("Xoá người dùng thất bại");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Quản lý người dùng và phân quyền hệ thống</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === "users" ? "bg-white border border-b-white border-gray-200 text-indigo-600 -mb-px" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        <i className="bi bi-people mr-2"></i>Người dùng
                    </button>
                    <button
                        onClick={() => setActiveTab("rooms")}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === "rooms" ? "bg-white border border-b-white border-gray-200 text-indigo-600 -mb-px" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        <i className="bi bi-door-open mr-2"></i>Quản lý phòng
                    </button>
                </div>

                {activeTab === "rooms" && (
                    <div>
                        <div className="flex gap-2 mb-6 border-b border-gray-200">
                            <button
                                onClick={() => setRoomSubTab("list")}
                                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${roomSubTab === "list" ? "bg-white border border-b-white border-gray-200 text-indigo-600 -mb-px" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <i className="bi bi-list-ul mr-2"></i>Danh sách phòng
                            </button>
                            <button
                                onClick={() => setRoomSubTab("add")}
                                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${roomSubTab === "add" ? "bg-white border border-b-white border-gray-200 text-indigo-600 -mb-px" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <i className="bi bi-plus-circle mr-2"></i>Thêm phòng
                            </button>
                        </div>
                        {roomSubTab === "list" ? <ExistingRoom /> : <AddRoom />}
                    </div>
                )}

                {activeTab === "users" && <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {[
                            { label: "Tổng người dùng", value: users.length, icon: "bi-people", color: "text-indigo-600 bg-indigo-50" },
                            { label: "Admin", value: users.filter(u => u.roleName === "ADMIN").length, icon: "bi-shield-check", color: "text-red-600 bg-red-50" },
                            { label: "Staff", value: users.filter(u => u.roleName === "STAFF").length, icon: "bi-person-badge", color: "text-blue-600 bg-blue-50" },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                    <i className={`bi ${stat.icon} text-xl`}></i>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                    <p className="text-sm text-gray-500">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* User Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Danh sách người dùng</h2>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-16">
                                <span className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Người dùng</th>
                                            <th className="px-6 py-3 text-left">Email</th>
                                            <th className="px-6 py-3 text-left">Trạng thái</th>
                                            <th className="px-6 py-3 text-left">Vai trò</th>
                                            <th className="px-6 py-3 text-left">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm">
                                                            {user.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-gray-900">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-sm">{user.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${user.isAccountVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                                        <i className={`bi ${user.isAccountVerified ? "bi-check-circle" : "bi-exclamation-circle"}`}></i>
                                                        {user.isAccountVerified ? "Đã xác thực" : "Chưa xác thực"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <i className="bi bi-trash3 mr-1"></i>Xoá
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>}
            </div>
        </div>
    );
};

export default AdminDashboard;
