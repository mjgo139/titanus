import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Acceso from './screens/Acceso';
import Hoy from './screens/Hoy';
import { useApp } from './ui/contexto';
import { Marco } from './ui/Marco';
import { Cargando } from './ui/piezas';

const Entreno = lazy(() => import('./screens/Entreno'));
const EditarRutina = lazy(() => import('./screens/EditarRutina'));
const Entrenar = lazy(() => import('./screens/Entrenar'));
const Resumen = lazy(() => import('./screens/Resumen'));
const Progreso = lazy(() => import('./screens/Progreso'));
const DetalleEjercicio = lazy(() => import('./screens/DetalleEjercicio'));
const Perfil = lazy(() => import('./screens/Perfil'));
const PanelClientes = lazy(() => import('./pro/PanelClientes'));
const FichaCliente = lazy(() => import('./pro/FichaCliente'));
const MiProfesional = lazy(() => import('./pro/MiProfesional'));
const Admin = lazy(() => import('./pro/Admin'));

export default function App() {
  const { usuario, perfil, cargando } = useApp();
  if (cargando) return <div className="min-h-screen"><Cargando /></div>;
  return (
    <BrowserRouter>
      {!usuario || !perfil ? (
        <Routes><Route path="*" element={<Acceso />} /></Routes>
      ) : (
        <Suspense fallback={<Cargando />}>
          <Routes>
            <Route element={<Marco />}>
              <Route index element={<Hoy />} />
              <Route path="entreno" element={<Entreno />} />
              <Route path="rutinas" element={<Navigate to="/entreno" replace />} />
              <Route path="rutinas/:id" element={<EditarRutina />} />
              <Route path="entrenar" element={<Entrenar />} />
              <Route path="resumen" element={<Resumen />} />
              <Route path="progreso" element={<Progreso />} />
              <Route path="progreso/ejercicio/:id" element={<DetalleEjercicio />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="clientes" element={<PanelClientes />} />
              <Route path="clientes/:uid" element={<FichaCliente />} />
              <Route path="clientes/:uid/rutinas/:id" element={<EditarRutina />} />
              <Route path="mi-entrenador" element={<MiProfesional />} />
              <Route path="admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      )}
    </BrowserRouter>
  );
}
