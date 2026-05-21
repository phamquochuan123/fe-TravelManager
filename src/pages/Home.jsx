import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { AppContext } from "../context/AppContext";
import MenuBar from "../components/Menubar";
import { getAllHotels } from "../api/hotelApi";
import HotelCard from "../components/hotel/HotelCard";
import { getAllRestaurants } from "../api/restaurantApi";
import { getAllTours } from "../api/tourApi";

const WHY_US = [
    { icon: "bi-shield-check-fill", title: "An toàn & Bảo mật", desc: "Thông tin cá nhân và thanh toán được bảo vệ tuyệt đối.", color: "from-sky-500 to-blue-600" },
    { icon: "bi-clock-fill", title: "Đặt phòng nhanh chóng", desc: "Chỉ vài bước đơn giản để có ngay dịch vụ ưng ý.", color: "from-cyan-500 to-sky-600" },
    { icon: "bi-building-fill", title: "Đa dạng lựa chọn", desc: "Khách sạn, resort, tour và nhà hàng trên khắp Việt Nam.", color: "from-blue-500 to-indigo-600" },
    { icon: "bi-headset", title: "Hỗ trợ 24/7", desc: "Đội ngũ hỗ trợ luôn sẵn sàng giải đáp mọi thắc mắc.", color: "from-amber-400 to-orange-500" },
];

const STEPS = [
    { step: "01", icon: "bi-search", title: "Tìm kiếm", desc: "Nhập điểm đến, chọn ngày và loại dịch vụ." },
    { step: "02", icon: "bi-card-checklist", title: "Lựa chọn", desc: "So sánh giá cả, tiện ích và chọn phù hợp với bạn." },
    { step: "03", icon: "bi-calendar-check-fill", title: "Đặt & Tận hưởng", desc: "Xác nhận đặt chỗ và tận hưởng kỳ nghỉ tuyệt vời." },
];

const CATEGORIES = [
    { icon: "bi-building", label: "Khách sạn", path: "/hotels", color: "from-sky-500 to-blue-600", count: "500+" },
    { icon: "bi-map", label: "Tour du lịch", path: "/tours", color: "from-emerald-500 to-teal-600", count: "200+" },
    { icon: "bi-cup-hot", label: "Nhà hàng", path: "/restaurants", color: "from-orange-500 to-amber-600", count: "300+" },
    { icon: "bi-geo-alt", label: "Điểm đến", path: "/destinations", color: "from-purple-500 to-violet-600", count: "150+" },
];

const Home = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useContext(AppContext);
    const [featuredHotels, setFeaturedHotels] = useState([]);
    const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
    const [featuredTours, setFeaturedTours] = useState([]);
    const [searchCity, setSearchCity] = useState("");

    useEffect(() => {
        getAllHotels().then(data => setFeaturedHotels(data.slice(0, 6))).catch(() => {});
        getAllRestaurants().then(data => setFeaturedRestaurants(data.slice(0, 3))).catch(() => {});
        getAllTours().then(data => setFeaturedTours(data.slice(0, 3))).catch(() => {});
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = searchCity.trim() ? `?city=${encodeURIComponent(searchCity.trim())}` : "";
        navigate(`/hotels${params}`);
    };

    return (
        <div className="font-['Outfit']">
            <MenuBar />

            {/* Hero */}
            <Header />

            {/* Search bar - floating */}
            <section className="bg-white py-10 px-6 shadow-sm relative">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSearch} className="flex gap-3 flex-col sm:flex-row">
                        <div className="relative flex-1">
                            <i className="bi bi-geo-alt-fill absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 text-lg" />
                            <input
                                type="text"
                                placeholder="Bạn muốn đến đâu? (Hà Nội, Đà Nẵng, Hội An...)"
                                value={searchCity}
                                onChange={e => setSearchCity(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 font-medium text-gray-700 placeholder-gray-400 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold px-8 py-4 rounded-2xl transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-sky-200 hover:shadow-sky-300 hover:scale-105 active:scale-95"
                        >
                            <i className="bi bi-search" /> Tìm kiếm
                        </button>
                    </form>
                </div>
            </section>

            {/* Categories */}
            <section className="py-14 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-10">
                        <span className="inline-block px-3 py-1 bg-sky-100 text-sky-600 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">Dịch vụ</span>
                        <h2 className="text-3xl font-black text-gray-900">Tất cả trong một nơi</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.path}
                                onClick={() => navigate(cat.path)}
                                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-left"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <i className={`bi ${cat.icon} text-2xl`} />
                                </div>
                                <p className="font-black text-gray-900 text-lg mb-0.5">{cat.label}</p>
                                <p className="text-sm text-gray-400 font-medium">{cat.count} lựa chọn</p>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured hotels */}
            {featuredHotels.length > 0 && (
                <section className="py-16 px-6 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-end justify-between mb-10">
                            <div>
                                <span className="inline-block px-3 py-1 bg-sky-100 text-sky-600 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">Nổi bật</span>
                                <h2 className="text-3xl font-black text-gray-900">Khách sạn được yêu thích</h2>
                                <p className="text-gray-500 mt-1">Những lựa chọn hàng đầu được khách hàng đánh giá cao</p>
                            </div>
                            <button
                                onClick={() => navigate("/hotels")}
                                className="hidden sm:flex items-center gap-2 text-sky-500 font-semibold text-sm hover:underline"
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
                            <button onClick={() => navigate("/hotels")} className="text-sky-500 font-semibold text-sm hover:underline">
                                Xem tất cả khách sạn <i className="bi bi-arrow-right" />
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Featured restaurants */}
            {featuredRestaurants.length > 0 && (
                <section className="py-16 px-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-end justify-between mb-10">
                            <div>
                                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">Ẩm thực</span>
                                <h2 className="text-3xl font-black text-gray-900">Nhà hàng nổi bật</h2>
                                <p className="text-gray-500 mt-1">Trải nghiệm ẩm thực đặc sắc tại những nhà hàng hàng đầu</p>
                            </div>
                            <button onClick={() => navigate("/restaurants")} className="hidden sm:flex items-center gap-2 text-orange-500 font-semibold text-sm hover:underline">
                                Xem tất cả <i className="bi bi-arrow-right" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {featuredRestaurants.map(r => (
                                <div
                                    key={r.id}
                                    onClick={() => navigate(`/restaurants/${r.id}`)}
                                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-orange-100/40 hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
                                >
                                    <div className="relative overflow-hidden">
                                        {r.photo ? (
                                            <img src={`data:image/jpeg;base64,${r.photo}`} alt={r.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                                                <i className="bi bi-cup-hot text-5xl text-orange-300" />
                                            </div>
                                        )}
                                        {r.cuisineType && (
                                            <div className="absolute top-3 left-3">
                                                <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">{r.cuisineType}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-orange-600 transition-colors">{r.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                            <i className="bi bi-geo-alt text-orange-400" /> {r.city}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Featured tours */}
            {featuredTours.length > 0 && (
                <section className="py-16 px-6 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-end justify-between mb-10">
                            <div>
                                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-600 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">Khám phá</span>
                                <h2 className="text-3xl font-black text-gray-900">Tour du lịch hấp dẫn</h2>
                                <p className="text-gray-500 mt-1">Những hành trình đáng nhớ đang chờ bạn</p>
                            </div>
                            <button onClick={() => navigate("/tours")} className="hidden sm:flex items-center gap-2 text-emerald-600 font-semibold text-sm hover:underline">
                                Xem tất cả <i className="bi bi-arrow-right" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {featuredTours.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => navigate(`/tours/${t.id}`)}
                                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-emerald-100/40 hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
                                >
                                    <div className="relative overflow-hidden">
                                        {t.images && t.images.length > 0 ? (
                                            <img
                                                src={`data:image/jpeg;base64,${btoa(String.fromCharCode(...new Uint8Array(t.images[0].photo)))}`}
                                                alt={t.name}
                                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                                <i className="bi bi-map text-5xl text-emerald-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <span className="bg-white/90 backdrop-blur text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                                                {t.durationDays} ngày
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-gray-900 text-base line-clamp-2 group-hover:text-emerald-600 transition-colors">{t.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                            <i className="bi bi-geo-alt text-emerald-500" /> {t.destination}
                                        </p>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                            <span className="text-emerald-600 font-black text-base">
                                                {t.priceAdult?.toLocaleString("vi-VN")}₫
                                            </span>
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{t.durationDays} ngày</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Why choose us */}
            <section className="py-16 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-3 py-1 bg-sky-100 text-sky-600 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">Lợi ích</span>
                        <h2 className="text-3xl font-black text-gray-900">Vì sao chọn chúng tôi?</h2>
                        <p className="text-gray-500 mt-2 max-w-xl mx-auto">Chúng tôi cung cấp trải nghiệm du lịch tốt nhất với dịch vụ chất lượng cao</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {WHY_US.map(f => (
                            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${f.color} text-white flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <i className={`bi ${f.icon} text-xl`} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 px-6 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">Hướng dẫn</span>
                        <h2 className="text-3xl font-black text-gray-900">Chỉ <span className="text-sky-500">3 bước</span> đơn giản</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {STEPS.map((s, idx) => (
                            <div key={s.step} className="relative text-center">
                                {idx < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-sky-200 to-transparent" />
                                )}
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white text-2xl mb-4 shadow-xl shadow-sky-200 relative z-10 hover:scale-110 transition-transform">
                                    <i className={`bi ${s.icon}`} />
                                </div>
                                <div className="inline-block px-3 py-0.5 bg-sky-100 text-sky-600 text-xs font-black rounded-full mb-2 tracking-widest">{s.step}</div>
                                <h3 className="text-lg font-black text-gray-900 mb-1">{s.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            {!isLoggedIn && (
                <section className="py-20 px-6 bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-600 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                    <div className="max-w-3xl mx-auto text-center relative z-10">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Sẵn sàng cho chuyến đi tiếp theo?</h2>
                        <p className="text-white/75 mb-8">Đăng ký miễn phí và khám phá hàng trăm điểm đến trên khắp Việt Nam.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate("/register")}
                                className="bg-white text-sky-600 font-bold px-10 py-4 rounded-full hover:shadow-2xl hover:-translate-y-1 transition-all"
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
            <footer className="bg-gray-900 text-gray-400 py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2 rounded-xl shadow-lg">
                                    <i className="bi bi-globe2 text-white text-lg" />
                                </div>
                                <span className="font-black text-white text-xl tracking-tighter">
                                    Travel<span className="text-sky-400">Manager</span>
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-500 max-w-xs">Nền tảng du lịch toàn diện giúp bạn khám phá và đặt dịch vụ dễ dàng trên khắp Việt Nam.</p>
                        </div>
                        <div>
                            <p className="text-white font-bold mb-4">Dịch vụ</p>
                            {[
                                { label: "Khách sạn", path: "/hotels" },
                                { label: "Tour du lịch", path: "/tours" },
                                { label: "Nhà hàng", path: "/restaurants" },
                                { label: "Điểm đến", path: "/destinations" },
                            ].map(link => (
                                <button key={link.path} onClick={() => navigate(link.path)} className="block text-sm text-gray-500 hover:text-sky-400 transition-colors mb-2">
                                    {link.label}
                                </button>
                            ))}
                        </div>
                        <div>
                            <p className="text-white font-bold mb-4">Tài khoản</p>
                            {[
                                { label: "Đăng nhập", path: "/login" },
                                { label: "Đăng ký", path: "/register" },
                                { label: "Đặt chỗ của tôi", path: "/my-bookings" },
                                { label: "Hồ sơ", path: "/profile" },
                            ].map(link => (
                                <button key={link.path} onClick={() => navigate(link.path)} className="block text-sm text-gray-500 hover:text-sky-400 transition-colors mb-2">
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm">© 2025 TravelManager. All rights reserved.</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-800 px-3 py-1.5 rounded-full">Spring Boot</span>
                            <span className="text-xs bg-gray-800 px-3 py-1.5 rounded-full">React + Vite</span>
                            <span className="text-xs bg-gray-800 px-3 py-1.5 rounded-full">Tailwind CSS</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
