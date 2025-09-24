import { Chat } from "../src/index";
import Login from "../src/login/Login";
import { useState } from "react";
function App() {
    const [isLogin, setIsLogin] = useState(localStorage.getItem("code"));
    return <>{isLogin ? <Chat /> : <Login></Login>}</>;
}

export default App;
