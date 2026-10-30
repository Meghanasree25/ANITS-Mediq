
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { supabase } from "../lib/supabase";

type Role = "patient" | "nurse" | "doctor" | "admin";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: Role;
}

export default function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      setLoading(true);
      setAuthenticated(false);
      setUserRole(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      if (!active) return;

      if (!profileError && profile) {
        setAuthenticated(true);
        setUserRole(profile.role);
      }

      setLoading(false);
    }

    void verifyAccess();

    return () => {
      active = false;
    };
  }, [allowedRole]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "Arial, sans-serif",
          color: "#0f766e",
          fontSize: "18px",
          fontWeight: 600,
        }}
      >
        Verifying MEDIQ access...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (userRole !== allowedRole) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  return <>{children}</>;
}
