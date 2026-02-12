import { Outlet } from "react-router-dom";
// import Navbar from "./Navbar";
// import { ProductProvider } from "./ProductContext";
// import { CartProvider } from "./CartContext";
// import Footer from "./Footer";

export default function UserLayout() {
  return (
    // <ProductProvider>
    //   <CartProvider>
    //     <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
    //       <Navbar />

          <main style={{ flex: 1, padding: "20px" }}>
            <Outlet />
          </main>

        //   <Footer />
        // </div>
    //   </CartProvider>
    // </ProductProvider>
  );
}
