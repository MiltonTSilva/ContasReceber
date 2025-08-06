import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./Routes";
import "./App.css";
import { GlobalProvider } from "./Hooks/globalProvider";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "./global";
import { lightTheme, darkTheme } from "./theme";
import ToggleTheme from "./Components/ToggleTheme/ToggleTheme";
import { useState } from "react";
import { useLocation } from "react-router-dom";

const AppContent: React.FC<{
  isDarkMode: boolean;
  toggleTheme: () => void;
}> = ({ isDarkMode, toggleTheme }) => {
  const location = useLocation();
  const shouldShowToggleTheme =
    location.pathname !== "/login" &&
    location.pathname !== "/forgot" &&
    location.pathname !== "/register";
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle theme={theme} />
      {shouldShowToggleTheme && (
        <ToggleTheme
          toggleTheme={toggleTheme}
          theme={isDarkMode ? "dark" : "light"}
        />
      )}
      <GlobalProvider>
        <AppRoutes />
      </GlobalProvider>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });
  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <BrowserRouter>
      <AppContent isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
    </BrowserRouter>
  );
};
export default App;
