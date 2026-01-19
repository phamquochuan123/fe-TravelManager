import { assets } from "../assets/assets";

const Header = () => {
    return (
        <div
            className="d-flex align-items-center justify-content-center text-center"
            style={{
                minHeight: "90vh",
                backgroundImage: `
          linear-gradient(
            rgba(0,0,0,0.45),
            rgba(0,0,0,0.45)
          ),
          url(${assets.header})
        `,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="container text-white px-3">

                <h6 className="text-uppercase fw-semibold mb-3 opacity-75">
                    Hey bro 😘
                </h6>

                <h1 className="fw-bold display-3 mb-3">
                    Welcome to <span className="text-warning">Travel Manager</span>
                </h1>

                <p
                    className="fs-5 mb-4 mx-auto opacity-75"
                    style={{ maxWidth: "650px" }}
                >
                    Discover tours, hotels, restaurants and amazing destinations
                    easily — all in one place.
                </p>

                <button className="btn btn-warning btn-lg rounded-pill px-5 shadow">
                    Get Started
                </button>
            </div>
        </div>
    );
};

export default Header;
