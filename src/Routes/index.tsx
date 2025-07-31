import { Navigate, Route, Routes } from "react-router-dom";

import { Register } from "../Pages/login/resgister";
import { Login } from "../Pages/login/login";
import { Home } from "../Pages/Home/home";
import { Clientes } from "../Pages/Clientes/clientes";
import { ClientesForm } from "../Pages/Clientes/clientesForm";
import { Recebimentos } from "../Pages/Recebimentos/recebimentos";
import { RecebimentosForm } from "../Pages/Recebimentos/recebimentosForm";
import { Sobre } from "../Pages/Sobre/sobre";

import { ProtectedRoute } from "../Components/ProtectedRoute/ProtectedRoute";
import { useGlobalState } from "../Hooks/useGlobalState";
import { Forgot } from "../Pages/login/forgot";
import { UpdatePassword } from "../Pages/login/updatePassword";

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
        path="/clientes/clientesForm"
        element={
          <ProtectedRoute>
            <ClientesForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/clientesForm/:id"
        element={
          <ProtectedRoute>
            <ClientesForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recebimentos"
        element={
          <ProtectedRoute>
            <Recebimentos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recebimentos/recebimentosForm"
        element={
          <ProtectedRoute>
            <RecebimentosForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recebimentos/recebimentosForm/:id"
        element={
          <ProtectedRoute>
            <RecebimentosForm />
          </ProtectedRoute>
        }
      />

      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/updatePassword" element={<UpdatePassword />} />
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
