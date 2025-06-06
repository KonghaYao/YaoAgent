import Chat from "../src/chat/Chat";
import Login from "../src/login/Login";
import { useState } from "react";
import { GraphServer } from "../src/graph-server/GraphServer";
function App() {
    const [isLogin, setIsLogin] = useState(localStorage.getItem("code"));
    if (location.pathname === "/graph-server") {
        return <GraphServer />;
    }
    return <>{isLogin ? <Chat /> : <Login></Login>}</>;
}

export default App;
