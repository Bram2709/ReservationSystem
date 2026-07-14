import './App.css'
import { Route, Routes } from 'react-router-dom'
import { LandingPage } from './Pages/LandingPage.tsx';
import { DashboardPage } from './Pages/Dashboard/DashboardPage.tsx';
import { AppLayout } from './Components/Layout/AppLayout/AppLayout.tsx';
import { ReservationsPage } from './Pages/Reservations/ReservationsPage.tsx';
import { Room } from './Pages/Room/Room.tsx';
import { RestaurantsConfig } from './Pages/RestaurantsConfig/RestaurantsConfig.tsx';
import { LoginPage } from './Pages/Login/LoginPage.tsx';
import { AuthLayout } from './Components/Layout/AuthLayout/AuthLayout.tsx';
import { RegisterPage } from './Pages/Register/RegisterPage.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ProtectedRoute } from './Components/ProtectedRoute/ProtectedRoute.tsx';
import { Floorplan } from './Pages/Floorplan/Floorplan.tsx';
import { DashboardNewPage } from './Pages/DashboardNew/DashboardNewPage.tsx';
import { Restaurant } from './Pages/Restaurant/Restaurant.tsx';

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
            <Route path='/restaurants' element={<Restaurant />} />
            <Route path='/rooms' element={<Room />} />
            <Route path='/floorplan' element={<Floorplan />} />
            <Route path='/layout/rooms' element={<Room />} />
            <Route path='/layout/restaurants' element={<RestaurantsConfig />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App
