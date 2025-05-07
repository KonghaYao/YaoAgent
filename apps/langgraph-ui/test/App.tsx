import Chat from "../src/chat/Chat";
import Login from "../src/login/Login";
import { useState } from "react";
function App() {
    const [isLogin, setIsLogin] = useState(localStorage.getItem("code"));
    return <>{isLogin ? <Chat /> : <Login></Login>}</>;
}

export default App;
