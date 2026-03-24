import { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import MenuBar from "../../components/Menubar";

const StaffDashboard = () => {
    const { userData } = useContext(AppContext);

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff Dashboard</h1>
                    <p className="text-gray-500 mt-1">Xin chào, <span className="font-semibold text-indigo-600">{userData?.name}</span>!</p>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-200">
                        {userData?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-xl font-black text-gray-900">{userData?.name}</p>
                        <p className="text-gray-500 text-sm">{userData?.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            <i className="bi bi-person-badge"></i> STAFF
                        </span>
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { title: "Quản lý tour", desc: "Xem và cập nhật thông tin các chuyến du lịch", icon: "bi-map", color: "from-indigo-500 to-purple-500" },
                        { title: "Đơn đặt chỗ", desc: "Xử lý các yêu cầu đặt chỗ của khách hàng", icon: "bi-calendar-check", color: "from-blue-500 to-cyan-500" },
                        { title: "Hỗ trợ khách hàng", desc: "Trả lời câu hỏi và giải quyết vấn đề", icon: "bi-headset", color: "from-green-500 to-teal-500" },
                    ].map((card) => (
                        <div key={card.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer group">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                                <i className={`bi ${card.icon} text-xl`}></i>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{card.title}</h3>
                            <p className="text-sm text-gray-500">{card.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
