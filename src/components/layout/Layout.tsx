import { Outlet, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

export const Layout: React.FC = () => {
  const location = useLocation();

  const noNavbarRoutes = ["/login", "/signup"];

  const shouldHideNavbar = noNavbarRoutes.includes(
    location.pathname.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-light-blue-50 font-inter w-screen overflow-x-hidden">
      {/* Inject Custom Style Block here to define custom colors globally */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* CUSTOM COLOR PALETTE MAPPING */
            .text-dark-blue-600 { color: #035C84; } 
            .bg-dark-blue-600 { background-color: #035C84; }
            .hover\\:bg-dark-blue-700:hover { background-color: #0873A1; } 
            .text-dark-blue-800 { color: #003F5C; } 
            .border-dark-blue-600 { border-color: #035C84; } 
            
            .text-light-blue-200 { color: #94CCE7; } 
            .bg-light-blue-50 { background-color: #F0F8FF; }
            .bg-light-blue-100 { background-color: #E6F3FF; } 
            .bg-light-blue-200 { background-color: #94CCE7; } 
             .bg-light-blue-400 { background-color: #2DA0CC; } 
            .hover\\:bg-light-blue-300:hover { background-color: #79BDE1; } 
             .hover\\:bg-light-blue-400:hover { background-color: #2DA0CC; } 
          `,
        }}
      />
      
      {!shouldHideNavbar && <NavBar />}{" "}
      
      <main className="mx-auto pb-0"> 
        <Outlet />
      {!shouldHideNavbar && <Footer />}{" "}
      </main>
    </div>
  );
};