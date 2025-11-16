import NavBar from "../components/layout/NavBar";
import { ProtectedRoute } from "../components/ProtectedRoute";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import ClientPage from "../pages/ClientPage";
import LoginPage from "../pages/LoginPage";
export const AppRouter = () => {
  // Uses URL Hash for simple routing (e.g., #home, #login, #admin/dashboard)
  const currentHash =
    typeof window !== "undefined"
      ? window.location.hash.substring(1).toLowerCase() || "home"
      : "home"; // Default to 'home' for SSR safety

  let content;

  if (currentHash === "login") {
    content = <LoginPage />;
  } else if (currentHash.startsWith("admin/")) {
    // All paths starting with 'admin/' are protected
    content = (
      <ProtectedRoute>
        {/* Nested Admin Routes */}
        <div className="p-4 bg-gray-50 min-h-[calc(100vh-68px)]">
          {(() => {
            const adminPath = currentHash.substring(6); // Remove 'admin/'

            switch (adminPath) {
              case "users":
                return <AdminUsersPage />;
              case "products":
                return <AdminProductsPage />;
              case "dashboard":
              default:
                return <AdminDashboard />;
            }
          })()}
        </div>
      </ProtectedRoute>
    );
  } else {
    // Default and client routes are public
    content = <ClientPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <NavBar />
      <main className="max-w-7xl mx-auto py-6">{content}</main>
    </div>
  );
};
