import './App.css'
import { Route, Routes } from 'react-router-dom'
import { LandingPage } from './Pages/LandingPage.tsx';
import { AppLayout } from './Components/Layout/AppLayout/AppLayout.tsx';
import { ReservationsPage } from './Pages/Reservations/ReservationsPage.tsx';
import { RestaurantsPage } from './Pages/Restaurants/RestaurantsPage.tsx';
import { LoginPage } from './Pages/Login/LoginPage.tsx';
import { AuthLayout } from './Components/Layout/AuthLayout/AuthLayout.tsx';
import { RegisterPage } from './Pages/Register/RegisterPage.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ProtectedRoute } from './Components/ProtectedRoute/ProtectedRoute.tsx';
import { Floorplan } from './Pages/Floorplan/Floorplan.tsx';
import { FloorViewPage } from './Pages/FloorView/FloorViewPage.tsx';
import { DashboardNewPage } from './Pages/DashboardNew/DashboardNewPage.tsx';

function App() {

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path='/' element={<LandingPage />} />
        <Route element={<AuthLayout />}>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
        </Route>

        {/* Protected routes — redirects to /login if not authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path='/dashboard' element={<DashboardNewPage />} />
            <Route path='/reservations' element={<ReservationsPage />} />
            {/* Restaurants and their rooms are managed together on one page. */}
            <Route path='/restaurants' element={<RestaurantsPage />} />
            <Route path='/floorplan' element={<Floorplan />} />
            <Route path='/floor-view' element={<FloorViewPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App
