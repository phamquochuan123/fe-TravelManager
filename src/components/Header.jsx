import { useContext } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const Header = () => {
    const { userData } = useContext(AppContext);

    return (
        // Sửa min-h-screen và thêm w-full để nó không bị co cụm
        <div className="relative min-h-screen w-full flex items-center justify-center text-center px-4 overflow-hidden"
            style={{
                background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${assets.header})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}>

            {/* Giữ nguyên logic hiệu ứng animate của mày */}
            <div className="relative z-10 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">

                {/* Badge chào mừng */}
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 shadow-xl">
                    <span className="text-white text-sm font-medium tracking-wide">
                        Hey {userData ? userData.name : 'Developer'} 😘
                    </span>
                </div>

                {/* Tiêu đề - Cho text-6xl để nó hoành tráng */}
                <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-[1.1] tracking-tighter">
                    Welcome to <br />
                    <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
                        Travel Manager
                    </span>
                </h1>

                {/* Mô tả */}
                <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                    Discover tours, hotels, restaurants and amazing destinations
                    easily — <span className="text-white font-normal">all in one place.</span>
                </p>

                {/* Nút bấm */}
                <button className="group relative bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-12 rounded-full shadow-[0_10px_20px_rgba(234,179,8,0.3)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-xs">
                    Get Started
                    <div className="absolute inset-0 rounded-full bg-yellow-400 blur-lg opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </button>
            </div>

            {/* Decor phía dưới */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30 animate-bounce">
                <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
            </div>
        </div>
    );
};

export default Header;