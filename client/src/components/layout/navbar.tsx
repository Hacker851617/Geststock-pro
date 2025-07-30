import { Package } from "lucide-react";
import { Link, useLocation } from "wouter";

export function Navbar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const getLinkClass = (path: string) => {
    return isActive(path)
      ? "text-blue-600 border-b-2 border-blue-600 px-1 pt-1 pb-4 text-sm font-medium"
      : "text-slate-500 hover:text-slate-700 px-1 pt-1 pb-4 text-sm font-medium";
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Package className="text-2xl text-blue-600 mr-3" size={28} />
              <h1 className="text-xl font-bold text-slate-900">GestStock Pro</h1>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="/" className={getLinkClass("/")}>
                Tableau de bord
              </Link>
              <Link href="/movements" className={getLinkClass("/movements")}>
                Mouvements
              </Link>
              <Link href="/reports" className={getLinkClass("/reports")}>
                Rapports & Alertes
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JD</span>
              </div>
              <span className="text-sm font-medium text-slate-700">Jean Dupont</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
