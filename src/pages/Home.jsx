import Header from "../components/Header";
import MenuBar from "../components/MenuBar";
import Login from "./Login";

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-content-center min-vh-100">
            <MenuBar />
            <Header />

        </div>
    )
}
export default Home;