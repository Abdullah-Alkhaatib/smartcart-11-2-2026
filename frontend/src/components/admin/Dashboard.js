import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import { createTheme } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LayersIcon from "@mui/icons-material/Layers";
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { DemoProvider } from "@toolpad/core/internal";
import AdminProfile from "./AdminProfile";
import { useLocation, useNavigate } from "react-router-dom";
import UserIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardUsers from "./DashboardUsers";
import CategoryDashboard from "./CategoryDashboard";
import ProductionQuantityLimitsIcon from "@mui/icons-material/ProductionQuantityLimits";
import ProductDashboard from "./ProductDashboard";
import ArchiveIcon from "@mui/icons-material/Archive";
import ArchivedProducts from "./ArchivedProducts";
// import ProductDashboard from './ProductDashboard';
// import MessageIcon from '@mui/icons-material/Message';
// import ContentDashboard from './ContentDashboard';
// import AdminSupport from './AdminSupport';
// import orders icon
// import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// import OrdersDashboards from './OrdersDashboards';
import ContactMailIcon from "@mui/icons-material/ContactMail";
import ContactUsAdmin from "./ContactUsAdmin";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SupportDashboard from "./SupportDashboard";
//

const NAVIGATION = [
  {
    kind: "header",
    title: "القائمة الرئيسية",
  },
  {
    segment: "dashboard",
    title: "لوحة التحكم",
    icon: <DashboardIcon />,
  },
  {
    segment: "profile",
    title: "الملف الشخصي",
    icon: <LayersIcon />,
  },
  {
    segment: "users",
    title: "المستخدمين",
    icon: <UserIcon />,
  },
  {
    segment: "categories",
    title: "الأقسام",
    icon: <CategoryIcon />,
  },
  {
    segment: "products",
    title: "المنتجات",
    icon: <ProductionQuantityLimitsIcon />,
  },
  {
    segment: "archived-products",
    title: "المنتجات المحذوفة",
    icon: <ArchiveIcon />,
  },
  {
    segment: "contactUs",
    title: "رسائل التواصل",
    icon: <ContactMailIcon />,
  },
  {
    segment: "support",
    title: "الدعم الفني",
    icon: <SupportAgentIcon />,
  },
  {
    segment: "logout",
    title: "تسجيل الخروج",
    icon: <LogoutIcon />,
  },
  {
    kind: "divider",
  },
];

const handleLogout = () => {
  localStorage.removeItem("token");
  window.location.href = "/login"; // Redirect to login page after logout
};

const demoTheme = createTheme({
  direction: "rtl",
  palette: {
    mode: "dark",
    background: {
      default: "#000000",
      paper: "#000000",
    },
  },
});

function DemoPageContent({ pathname }) {
  return (
    <Box
      sx={{
        py: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* <Typography>Dashboard content for {pathname}</Typography> */}
      {pathname === "/profile" ? <AdminProfile /> : null}
      {pathname === "/users" ? <DashboardUsers /> : null}
      {pathname === "/categories" ? <CategoryDashboard /> : null}
      {pathname === "/products" ? <ProductDashboard /> : null}
      {pathname === "/archived-products" ? <ArchivedProducts /> : null}
      {pathname === "/contactUs" ? <ContactUsAdmin /> : null}
      {pathname === "/support" ? <SupportDashboard /> : null}
      {pathname === "/logout" ? handleLogout() : null}
    </Box>
  );
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
};

function Dashboard(props) {
  const location = useLocation(); // عشان نجيب المسار الحالي
  const navigate = useNavigate(); // عشان التنقل بين الصفحات

  const { window } = props;

  // const router = useDemoRouter('/dashboard');

  // Remove this const when copying and pasting into your project.
  const demoWindow = window !== undefined ? window() : undefined;

  const router = {
    pathname: location.pathname, // بجيب المسار الحالي
    navigate: (path) => navigate(path), // بستخدم الدالة navigate عشان أغير المسار
  };

  //   React.useEffect(() => {
  //   document.body.dir = 'rtl';
  // }, []);

  return (
    // Remove this provider when copying and pasting into your project.
    <DemoProvider window={demoWindow}>
      {/* preview-start */}
      <AppProvider
        navigation={NAVIGATION}
        router={router}
        theme={demoTheme}
        window={demoWindow}
        branding={{
          logo: (
            <img
              src="/admin.webp"
              alt="Logo"
              style={{ width: 40, height: 40, borderRadius: "50%" }}
            />
          ),
          title: <span style={{ marginRight: "10px" }}>لوحة تحكم المدير</span>,
        }}
      >
        <DashboardLayout
          sx={{
            "& .MuiDrawer-root": {
              right: 0,
              left: "auto",
            },

            "& .MuiDrawer-paper": {
              right: 0,
              left: "auto",
            },

            // ⭐ يعكس ترتيب النص والأيقونة
            "& .MuiListItemButton-root": {
              flexDirection: "row-reverse",
              textAlign: "right",
            },

            // ⭐ يقرب النص من الخط
            "& .MuiListItemText-root": {
              textAlign: "right",
              marginRight: 0,
            },

            // ⭐ يحرك الأيقونة لليسار
            "& .MuiListItemIcon-root": {
              minWidth: "unset",
              marginLeft: 0,
              marginRight: 0,
            },
          }}
        >
          <DemoPageContent pathname={router.pathname} />
        </DashboardLayout>
      </AppProvider>
      {/* preview-end */}
    </DemoProvider>
  );
}

Dashboard.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * Remove this when copying and pasting into your project.
   */
  window: PropTypes.func,
};

export default Dashboard;
