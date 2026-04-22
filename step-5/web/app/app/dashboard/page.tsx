"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { AppHeader } from "../../components/AppHeader";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/signin");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="dashboard">
      <AppHeader />
      <main className="dashboard-body">
        <div className="user-card">
          <h2>Profile</h2>
          <div className="user-field">
            <span className="user-field-label">ID</span>
            <span>{user.id}</span>
          </div>
          <div className="user-field">
            <span className="user-field-label">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="user-field">
            <span className="user-field-label">Joined</span>
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
