import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { AppContext } from "../context/AppContext";
import MenuBar from "../components/Menubar";
import { getAllHotels } from "../api/hotelApi";
import HotelCard from "../components/hotel/HotelCard";

const WHY_US = [
    { icon: "bi-shield-check-fill", title: "An toàn & Bảo mật", desc: "Thông tin cá nhân và thanh toán được bảo vệ tuyệt đối.", color: "from-indigo-500 to-purple-500" },
    { icon: "bi-clock-fill", title: "Đặt phòng nhanh chóng", desc: "Chỉ vài bước đơn giản để có ngay phòng khách sạn ưng ý.", color: "from-blue-500 to-cyan-500" },
    { icon: "bi-building-fill", title: "Đa dạng lựa chọn", desc: "Khách sạn, resort, homestay trên khắp Việt Nam.", color: "from-emerald-500 to-teal-500" },
    { icon: "bi-headset", title: "Hỗ trợ 24/7", desc: "Đội ngũ hỗ trợ luôn sẵn sàng giải đáp mọi thắc mắc.", color: "from-orange-500 to-red-500" },
];

const STEPS = [
    { step: "01", icon: "bi-search", title: "Tìm kiếm", desc: "Nhập điểm đến, chọn ngày và số lượng khách." },
    { step: "02", icon: "bi-door-open-fill", title: "Chọn phòng", desc: "So sánh giá cả, tiện ích và chọn phòng phù hợp." },
    { step: "03", icon: "bi-calendar-check-fill", title: "Đặt & Tận hưởng", desc: "Xác nhận đặt phòng và tận hưởng kỳ nghỉ tuyệt vời." },
];

const Home = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useContext(AppContext);
    const [featuredHotels, setFeaturedHotels] = useState([]);
    const [searchCity, setSearchCity] = useState("");

    useEffect(() => {
        getAllHotels().then(data => setFeaturedHotels(data.slice(0, 6))).catch(() => {});
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = searchCity.trim() ? `?city=${encodeURIComponent(searchCity.trim())}` : "";
        navigate(`/hotels${params}`);
    };

    return (
        <div className="font-['Outfit']">
            <MenuBar />

            {/* Hero — full screen with background image */}
            <Header />

            {/* Quick search bar */}
            <section className="bg-white py-10 px-6 shadow-sm">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSearch} className="flex gap-3 flex-col sm:flex-row">
                        <div className="relative flex-1">
                            <i className="bi bi-geo-alt absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg" />
                            <input
                                type="text"
                                placeholder="Bạn muốn đến đâu? (Hà Nội, Đà Nẵng, Hội An...)"
                                value={searchCity}
                                onChange={e => setSearchCity(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 font-medium text-gray-700 placeholder-gray-400"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors flex items-center gap-2 shrink-0"
                        >
                            <i className="bi bi-search" /> Tìm kiếm
                        </button>
                    </form>
                </div>
            </section>

            {/* Featured hotels */}
            {featuredHotels.length > 0 && (
                <section className="py-16 px-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-end justify-between mb-10">
                            <div>
                                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">Nổi bật</span>
                                <h2 className="text-3xl font-black text-gray-900">Khách sạn được yêu thích</h2>
                                <p className="text-gray-500 mt-1">Những lựa chọn hàng đầu được khách hàng đánh giá cao</p>
                            </div>
                            <button
                                onClick={() => navigate("/hotels")}
                                className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold text-sm hover:underline"
                            >
                                Xem tất cả <i className="bi bi-arrow-right" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {featuredHotels.map(hotel => (
                                <HotelCard key={hotel.id} hotel={hotel} />
                            ))}
                        </div>
                        <div className="text-center mt-8 sm:hidden">
                            <button
                                onClick={() => navigate("/hotels")}
                                className="text-indigo-600 font-semibold text-sm hover:underline"
                            >
                                Xem tất cả khách sạn <i className="bi bi-arrow-right" />
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Why choose us */}
            <section className="py-16 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-600 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">Lợi ích</span>
                        <h2 className="text-3xl font-black text-gray-900">Vì sao chọn chúng tôi?</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {WHY_US.map(f => (
                            <div key={f.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${f.color} text-white flex items-center justify-center mb-4 shadow`}>
                                    <i className={`bi ${f.icon} text-lg`} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 px-6 bg-gray-50">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">Hướng dẫn</span>
                        <h2 className="text-3xl font-black text-gray-900">Đặt phòng chỉ trong <span className="text-indigo-600">3 bước</span></h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {STEPS.map((s, idx) => (
                            <div key={s.step} className="relative text-center">
                                {idx < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-indigo-200 to-transparent" />
                                )}
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-2xl mb-4 shadow-lg shadow-indigo-200 relative z-10">
                                    <i className={`bi ${s.icon}`} />
                                </div>
                                <div className="inline-block px-2.5 py-0.5 bg-gray-200 text-gray-500 text-xs font-black rounded-full mb-2 tracking-widest">{s.step}</div>
                                <h3 className="text-lg font-black text-gray-900 mb-1">{s.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            {!isLoggedIn && (
                <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Sẵn sàng cho chuyến đi tiếp theo?</h2>
                        <p className="text-white/75 mb-8">Đăng ký miễn phí và khám phá hàng trăm khách sạn trên khắp Việt Nam.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate("/login")}
                                className="bg-white text-indigo-600 font-bold px-10 py-4 rounded-full hover:shadow-2xl hover:-translate-y-1 transition-all"
                            >
                                Đăng ký miễn phí
                            </button>
                            <button
                                onClick={() => navigate("/hotels")}
                                className="border-2 border-white/40 text-white font-bold px-10 py-4 rounded-full hover:bg-white/10 transition-all"
                            >
                                Xem khách sạn
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-10 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-xl">
                            <i className="bi bi-globe2 text-white text-lg" />
                        </div>
                        <span className="font-black text-white text-xl tracking-tighter">
                            Travel<span className="text-indigo-400">Manager</span>
                        </span>
                    </div>
                    <p className="text-sm">© 2025 TravelManager. All rights reserved.</p>
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
