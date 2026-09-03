import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContext } from "../context/appContextObject";

const Header = () => {
    const { userData } = useContext(AppContext);
    const navigate = useNavigate();

    return (
        <div
            className="relative min-h-screen w-full flex items-center justify-center text-center px-4 overflow-hidden"
            style={{
                background: `linear-gradient(135deg, rgba(3,105,161,0.75) 0%, rgba(8,47,73,0.85) 100%), url(${assets.header})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Decorative orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">

                {/* Welcome badge */}
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 mb-8 shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span className="text-white/90 text-sm font-medium tracking-wide">
                        Xin chào, {userData ? userData.name : 'Du khách'}!
                    </span>
                    <i className="bi bi-airplane-fill text-sky-300 text-xs" />
                </div>

                {/* Headline */}
                <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white mb-6 leading-[1.05] tracking-tighter">
                    Khám phá thế giới<br />
                    <span className="text-sky-300">
                        cùng chúng tôi
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                    Tour du lịch, khách sạn, nhà hàng và điểm đến hàng đầu —{" "}
                    <span className="text-white/95 font-normal">tất cả trong một nơi.</span>
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                    <button
                        onClick={() => navigate('/hotels')}
                        className="group relative bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold py-4 px-10 rounded-full shadow-[0_10px_30px_rgba(251,191,36,0.35)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-xs"
                    >
                        <span>Khám phá ngay</span>
                        <div className="absolute inset-0 rounded-full bg-amber-300 blur-xl opacity-0 group-hover:opacity-30 transition-opacity" />
                    </button>
                    <button
                        onClick={() => navigate('/tours')}
                        className="border-2 border-white/30 text-white font-bold py-4 px-10 rounded-full hover:bg-white/10 backdrop-blur-sm transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-xs"
                    >
                        Xem tour
                    </button>
                </div>

                {/* Product assurances */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                    {["Xác nhận tức thì", "Hủy linh hoạt", "Thanh toán bảo mật"].map(f => (
                        <span key={f} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.15] text-white/70 text-xs font-medium tracking-wide">
                            <i className="bi bi-check2 text-sky-300 text-xs" />
                            {f}
                        </span>
                    ))}
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-40 animate-bounce">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-white text-xs tracking-widest uppercase font-light">Cuộn xuống</span>
                    <div className="w-[1px] h-10 bg-gradient-to-b from-white to-transparent" />
                </div>
            </div>
        </div>
    );
};

export default Header;
