// src/AdminRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function AdminRoute() {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, authed: false, isAdmin: false });

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;

        if (!user) {
          if (alive) setState({ loading: false, authed: false, isAdmin: false });
          return;
        }

        const { data: row, error } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          if (alive) setState({ loading: false, authed: true, isAdmin: false });
          return;
        }

        const isAdmin = String(row?.role || "").toLowerCase() === "admin";
        if (alive) setState({ loading: false, authed: true, isAdmin });
      } catch {
        if (alive) setState({ loading: false, authed: false, isAdmin: false });
      }
    }

    check();

    // Re-check on auth changes (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (state.loading) return null;

  // not logged in -> login
  if (!state.authed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // logged in but not admin -> home
  if (!state.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
