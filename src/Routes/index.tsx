import { Navigate, Route, Routes } from "react-router-dom";
import { Register } from "../Pages/login/resgister";
import { Login } from "../Pages/login/login";
import { Home } from "../Pages/Home/home";
import { Clientes } from "../Pages/Clientes/clientes";
import { Sobre } from "../Pages/Sobre/sobre";
import { ProtectedRoute } from "../Components/ProtectedRoute/ProtectedRoute";
import { Recebimento } from "../Pages/Recebimento/recebimento";
import { useGlobalState } from "../Hooks/useGlobalState";

export function AppRoutes() {
  const { user } = useGlobalState();
  return (
    <Routes>
      <Route
        path="/sobre"
        element={
          <ProtectedRoute>
            <Sobre />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recebimento"
        element={
          <ProtectedRoute>
            <Recebimento />
          </ProtectedRoute>
        }
      />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={user ? <Navigate to="/home" replace /> : <Login />}
      />
    </Routes>
  );
}
