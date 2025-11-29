import { Chat, DebugPanel } from "../src/index";
import { DebugPanelProvider } from "../src/debugPanel/Context";

function App() {
    return (
        <DebugPanelProvider>
            <Chat />
            <DebugPanel />
        </DebugPanelProvider>
    );
}

export default App;
