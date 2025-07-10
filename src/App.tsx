import { BrowserRouter } from "react-router-dom";
import { Footer } from "./Components/Footer/Footer";
import { Header } from "./Components/Header/Header";
import { AppRoutes } from "./Routes";
import "./App.css";
import { GlobalProvider } from "./Hooks/globalProvider";

function App() {
  return (
    <BrowserRouter>
      <GlobalProvider>
        <Header />
        <AppRoutes />
        <Footer />
      </GlobalProvider>
    </BrowserRouter>
  );
}

export default App;
