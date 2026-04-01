import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { AppContext } from "../context/AppContext";
import MenuBar from "../components/Menubar";

const features = [
    {
        icon: "bi-map-fill",
        title: "Tour Management",
        desc: "Manage and organize travel tours with ease. Create, update and track all your travel packages.",
        color: "from-indigo-500 to-purple-500"
    },
    {
        icon: "bi-calendar-check-fill",
        title: "Booking System",
        desc: "Handle customer bookings efficiently. Track reservations and manage availability in real-time.",
        color: "from-blue-500 to-cyan-500"
    },
    {
        icon: "bi-people-fill",
        title: "User Management",
        desc: "Manage customers and staff with role-based access. Assign permissions and track activity.",
        color: "from-green-500 to-teal-500"
    },
    {
        icon: "bi-graph-up-arrow",
        title: "Analytics",
        desc: "Get insights into your business performance with detailed reports and statistics.",
        color: "from-orange-500 to-red-500"
    },
    {
        icon: "bi-shield-check-fill",
        title: "Secure & Reliable",
        desc: "JWT-based authentication with role-based access control keeps your data safe.",
        color: "from-purple-500 to-pink-500"
    },
    {
        icon: "bi-envelope-check-fill",
        title: "Email Notifications",
        desc: "Automated email confirmations, OTP verification and password reset functionality.",
        color: "from-yellow-500 to-orange-500"
    }
];

const roles = [
    {
        role: "Admin",
        icon: "bi-shield-check",
        cardClass: "bg-red-50 border-red-200",
        textClass: "text-red-600",
        badgeClass: "bg-red-600",
        perms: ["Full system access", "Manage all users & roles", "View all reports", "System configuration"]
    },
    {
        role: "Staff",
        icon: "bi-person-badge",
        cardClass: "bg-blue-50 border-blue-200",
        textClass: "text-blue-600",
        badgeClass: "bg-blue-600",
        perms: ["Manage tours & bookings", "Customer support", "View staff dashboard", "Process reservations"]
    },
    {
        role: "User",
        icon: "bi-person-circle",
        cardClass: "bg-green-50 border-green-200",
        textClass: "text-green-600",
        badgeClass: "bg-green-600",
        perms: ["Browse all tours", "Make bookings", "Manage profile", "Email verification"]
    }
];

const steps = [
    { step: "01", title: "Create Account", desc: "Sign up in seconds and verify your email to get started.", icon: "bi-person-plus-fill" },
    { step: "02", title: "Explore Tours", desc: "Browse through hundreds of curated travel packages.", icon: "bi-compass-fill" },
    { step: "03", title: "Book & Travel", desc: "Book your trip instantly and enjoy a seamless experience.", icon: "bi-airplane-fill" },
];

const Home = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useContext(AppContext);

    return (
        <div className="font-['Outfit']">
            <MenuBar />
            <Header />

            {/* Features Section */}
            <section className="py-24 px-6 md:px-12 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-600 text-sm font-bold rounded-full mb-4 tracking-wider uppercase">Features</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
                            Everything you need to<br />
                            <span className="text-indigo-600">manage travel</span>
                        </h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                            A complete platform for managing tours, bookings and customer relationships.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f) => (
                            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${f.color} text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                                    <i className={`bi ${f.icon} text-xl`}></i>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-bold rounded-full mb-4 tracking-wider uppercase">How it works</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
                            Get started in <span className="text-indigo-600">3 easy steps</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((s, idx) => (
                            <div key={s.step} className="relative text-center">
                                {idx < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-indigo-200 to-transparent"></div>
                                )}
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-2xl mb-5 shadow-lg shadow-indigo-200 relative z-10">
                                    <i className={`bi ${s.icon}`}></i>
                                </div>
                                <div className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-black rounded-full mb-3 tracking-widest">{s.step}</div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">{s.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Roles Section */}
            <section className="py-24 px-6 md:px-12 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-600 text-sm font-bold rounded-full mb-4 tracking-wider uppercase">Access Control</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
                            Role-based <span className="text-indigo-600">permissions</span>
                        </h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                            Different levels of access for Admin, Staff and regular Users.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {roles.map((r) => (
                            <div key={r.role} className={`rounded-2xl p-6 border-2 ${r.cardClass} hover:shadow-lg transition-all duration-300`}>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className={`w-12 h-12 rounded-xl ${r.badgeClass} text-white flex items-center justify-center shadow-lg`}>
                                        <i className={`bi ${r.icon} text-xl`}></i>
                                    </div>
                                    <span className={`font-black text-xl ${r.textClass}`}>{r.role}</span>
                                </div>
                                <ul className="space-y-2.5">
                                    {r.perms.map(p => (
                                        <li key={p} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <i className={`bi bi-check-circle-fill text-xs ${r.textClass}`}></i>
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section — chỉ hiện khi chưa login */}
            {!isLoggedIn && (
                <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                            Ready to get started?
                        </h2>
                        <p className="text-white/75 text-lg mb-10 max-w-2xl mx-auto">
                            Join TravelManager today and take full control of your travel business.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate("/login")}
                                className="bg-white text-indigo-600 font-bold px-10 py-4 rounded-full hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95"
                            >
                                Get Started Free
                            </button>
                            <button
                                onClick={() => navigate("/login")}
                                className="border-2 border-white/40 text-white font-bold px-10 py-4 rounded-full hover:bg-white/10 transition-all active:scale-95"
                            >
                                Login
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-xl">
                            <i className="bi bi-globe2 text-white text-lg"></i>
                        </div>
                        <span className="font-black text-white text-xl tracking-tighter">
                            Travel<span className="text-indigo-400">Manager</span>
                        </span>
                    </div>
                    <p className="text-sm">© 2024 TravelManager. All rights reserved.</p>
                    <div className="flex items-center gap-3">
                        <span className="text-xs bg-gray-800 px-3 py-1.5 rounded-full">Spring Boot</span>
                        <span className="text-xs bg-gray-800 px-3 py-1.5 rounded-full">React + Vite</span>
                        <span className="text-xs bg-gray-800 px-3 py-1.5 rounded-full">JWT Auth</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
