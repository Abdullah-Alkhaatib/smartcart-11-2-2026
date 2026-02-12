import './App.css';
import {Toaster} from "react-hot-toast"; // npm install react-hot-toast
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from './components/auth/Register.js';
import Login from './components/auth/Login.js';
import { UserRoleProvider, useUserRole } from './components/UserRole';
import Dashboard from './components/admin/Dashboard.js';
import UserLayout from './components/user/UserLayout.js';

function App() {

  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontSize: 24,
        }}
      >
        Loading...
        <img
          src="https://media.tenor.com/o8m3bKTsifUAAAAM/hold-on.gif"
          alt="loading"
        />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <UserRoleProvider>
          <Toaster position='top-center' toastOptions={{ success: { duration: 2000 }, error: { duration: 2000 } }} />
          <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {role === "admin" ? (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Dashboard />} />
              <Route path="/users" element={<Dashboard />} />
              <Route path="/categories" element={<Dashboard />} />
              <Route path="/logout" element={<Dashboard />} />
            </>
          ) : (
            <Route path="/" element={<UserLayout />}>
            </Route>
          )}

        </Routes>
      </UserRoleProvider>
    </BrowserRouter>
  );
}

export default App;
