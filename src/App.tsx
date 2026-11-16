import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Acceso from './screens/Acceso';
import Hoy from './screens/Hoy';
import { useApp } from './ui/contexto';
import { Marco } from './ui/Marco';
import { Cargando } from './ui/piezas';

// Las pantallas se precargan apenas abre la app (cuando el teléfono está libre): así no hay pantallas "cargando" al navegar
const PRECARGAS = [
  () => import('./screens/Entreno'), () => import('./screens/EditarRutina'), () => import('./screens/Entrenar'),
  () => import('./screens/Resumen'), () => import('./screens/Progreso'), () => import('./screens/DetalleEjercicio'),
  () => import('./screens/Perfil'), () => import('./screens/VerRutina'), () => import('./screens/Programas'),
  () => import('./pro/PanelClientes'), () => import('./pro/FichaCliente'), () => import('./pro/MiProfesional'),
];
function precargar() {
  const ir = () => PRECARGAS.forEach((f) => f().catch(() => undefined));
  const w = window as Window & { requestIdleCallback?: (f: () => void) => void };
  if (w.requestIdleCallback) w.requestIdleCallback(ir); else setTimeout(ir, 800);
}
const Entreno = lazy(() => import('./screens/Entreno'));
const EditarRutina = lazy(() => import('./screens/EditarRutina'));
const Entrenar = lazy(() => import('./screens/Entrenar'));
const Resumen = lazy(() => import('./screens/Resumen'));
const Progreso = lazy(() => import('./screens/Progreso'));
const DetalleEjercicio = lazy(() => import('./screens/DetalleEjercicio'));
const Perfil = lazy(() => import('./screens/Perfil'));
const Conocerte = lazy(() => import('./screens/Conocerte'));
const VerRutina = lazy(() => import('./screens/VerRutina'));
const VerPrograma = lazy(() => import('./screens/Programas'));
const PaginaProgramas = lazy(() => import('./screens/Programas').then((m) => ({ default: m.PaginaProgramas })));
const PanelClientes = lazy(() => import('./pro/PanelClientes'));
const FichaCliente = lazy(() => import('./pro/FichaCliente'));
const MiProfesional = lazy(() => import('./pro/MiProfesional'));
const Admin = lazy(() => import('./pro/Admin'));

export default function App() {
  const { usuario, perfil, cargando } = useApp();
  useEffect(() => { if (usuario) precargar(); }, [usuario]);
  if (cargando) return <div className="mx-auto min-h-screen max-w-[480px] px-[17px] lg:max-w-[1180px]"><Cargando forma="pagina" /></div>;
  return (
    <BrowserRouter>
      {!usuario || !perfil ? (
        <Routes><Route path="*" element={<Acceso />} /></Routes>
      ) : (
        <Suspense fallback={<Cargando forma="pagina" />}>
          {!perfil.conocido ? (
            // Primera vez: la bienvenida "Conocerte" antes que nada
            <Routes><Route path="*" element={<Conocerte />} /></Routes>
          ) : (
          <Routes>
            <Route path="conocerte" element={<Conocerte />} />
            <Route element={<Marco />}>
              <Route index element={<Hoy />} />
              <Route path="entreno" element={<Entreno />} />
              <Route path="rutinas" element={<Navigate to="/entreno" replace />} />
              <Route path="rutinas/:id" element={<EditarRutina />} />
              <Route path="rutinas/:id/ver" element={<VerRutina />} />
              <Route path="programas" element={<PaginaProgramas />} />
              <Route path="programas/:id" element={<VerPrograma />} />
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
          )}
        </Suspense>
      )}
    </BrowserRouter>
  );
}
