import './App.css';
import {Toaster} from "react-hot-toast";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserRoleProvider, useUserRole } from './components/UserRole';
import Register from './components/auth/Register';
import Login from './components/auth/Login';

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
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
        </Routes>
      </UserRoleProvider>
    </BrowserRouter>
  );
}

export default App;
