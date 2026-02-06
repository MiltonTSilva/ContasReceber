import { Navigate, Route, Routes } from "react-router-dom";

import { Register } from "../Pages/login/resgister";
import { Login } from "../Pages/login/login";
import { Home } from "../Pages/Home/home";

import { Clientes } from "../Pages/Clientes/clientes";
import { ClientesForm } from "../Pages/Clientes/clientesForm";

import { Empresas } from "../Pages/Empresas/empresas";
import { EmpresasForm } from "../Pages/Empresas/empresasForm";

import { Pagamentos } from "../Pages/Pagamentos/pagamentos";
import { PagamentosForm } from "../Pages/Pagamentos/pagamentosForm";

import { Recebimentos } from "../Pages/Recebimentos/recebimentos";
import { RecebimentosForm } from "../Pages/Recebimentos/recebimentosForm";

import { TiposDespesas } from "../Pages/TiposDespesas/tiposdepesas";
import { TiposDespesasForm } from "../Pages/TiposDespesas/tiposdepesasForm";

import { Despesas } from "../Pages/Despesas/depesas";
import { DespesasForm } from "../Pages/Despesas/depesasForm";

import { Usuarios } from "../Pages/Usuarios/usuarios";
import { UsuariosForm } from "../Pages/Usuarios/usuariosForm";

import { Vendas } from "../Pages/Vendas/vendas";
import { VendasForm } from "../Pages/Vendas/vendasForm";

import { Produtos } from "../Pages/Produtos/produtos";
import { ProdutosForm } from "../Pages/Produtos/produtosForm";

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
        path="/despesas"
        element={
          <ProtectedRoute>
            <Despesas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/despesas/despesasForm"
        element={
          <ProtectedRoute>
            <DespesasForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/despesas/despesasForm/:id"
        element={
          <ProtectedRoute>
            <DespesasForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas"
        element={
          <ProtectedRoute>
            <Empresas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas/empresasForm"
        element={
          <ProtectedRoute>
            <EmpresasForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas/empresasForm/:id"
        element={
          <ProtectedRoute>
            <EmpresasForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <Usuarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios/usuariosForm"
        element={
          <ProtectedRoute>
            <UsuariosForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios/usuariosForm/:id"
        element={
          <ProtectedRoute>
            <UsuariosForm />
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
        path="/pagamentos"
        element={
          <ProtectedRoute>
            <Pagamentos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pagamentos/pagamentosForm"
        element={
          <ProtectedRoute>
            <PagamentosForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pagamentos/pagamentosForm/:id"
        element={
          <ProtectedRoute>
            <PagamentosForm />
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
      <Route
        path="/tiposdespesas"
        element={
          <ProtectedRoute>
            <TiposDespesas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tiposdespesas/tiposdespesasForm"
        element={
          <ProtectedRoute>
            <TiposDespesasForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tiposdespesas/tiposdespesasForm/:id"
        element={
          <ProtectedRoute>
            <TiposDespesasForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendas"
        element={
          <ProtectedRoute>
            <Vendas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recebimentos/recebimentosForm"
        element={
          <ProtectedRoute>
            <VendasForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendas/vendasForm/:id"
        element={
          <ProtectedRoute>
            <VendasForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/produtos"
        element={
          <ProtectedRoute>
            <Produtos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/produtos/novo"
        element={
          <ProtectedRoute>
            <ProdutosForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/produtos/:id"
        element={
          <ProtectedRoute>
            <ProdutosForm />
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
