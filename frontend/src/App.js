import "./App.css";
import { Toaster } from "react-hot-toast"; // npm install react-hot-toast
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./components/auth/Register.js";
import Login from "./components/auth/Login.js";
import { useUserRole } from "./components/UserRole";
import Dashboard from "./components/admin/Dashboard.js";
import UserLayout from "./components/user/UserLayout.js";
import NotFound from "./pages/NotFound.js";
import Home from "./pages/Home.js";
import ProductDetails from "./pages/ProductDetails.js";
import Products from "./pages/Products.js";
import SearchResults from "./pages/SearchResults.js";
import ProfileUser from "./components/user/ProfileUser.js";
import Cart from "./pages/Cart.js";
import Nana from "./pages/Nana.js";

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
      <Toaster
        position="top-center"
        toastOptions={{
          success: { duration: 2000 },
          error: { duration: 2000 },
        }}
      />
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
            <Route path="/products" element={<Dashboard />} />
            <Route path="/archived-products" element={<Dashboard />} />
            <Route path="/logout" element={<Dashboard />} />
          </>
        ) : (
          <Route path="/" element={<UserLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="search-results" element={<SearchResults />} />
            <Route path="profile" element={<ProfileUser />} />
            <Route path="cart" element={<Cart />} />
            <Route path="nana" element={<Nana />} />
          </Route>
        )}

        <Route path="/*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
