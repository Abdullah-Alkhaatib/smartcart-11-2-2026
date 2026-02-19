import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.js";
import {ProductProvider} from "../context/ProductContext.js";
import { CartProvider } from "../context/CartContext.js";
// import Footer from "./Footer";

export default function UserLayout() {
  return (
    <ProductProvider>
      <CartProvider>
         <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
           <Navbar />

          {/* <main style={{ flex: 1, padding: "20px" }}> */}
          <main style={{ flex: 1 }}>
            <Outlet />
          </main>

           {/* <Footer /> */}
         </div>
      </CartProvider>
     </ProductProvider>
  );
}
