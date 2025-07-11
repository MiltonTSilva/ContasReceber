import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./Routes";
import "./App.css";
import { GlobalProvider } from "./Hooks/globalProvider";

function App() {
  return (
    <BrowserRouter>
      <GlobalProvider>
        <AppRoutes />
      </GlobalProvider>
    </BrowserRouter>
  );
}

export default App;
