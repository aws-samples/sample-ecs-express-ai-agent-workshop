"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export function AppHeader() {
  const { logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/items", label: "Items" },
  ];

  return (
    <header className="app-header">
      <nav className="app-nav">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`app-nav-link${pathname === href ? " app-nav-link-active" : ""}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="app-header-actions">
        <button className="btn-ghost" onClick={logout}>Sign out</button>
      </div>
    </header>
  );
}
