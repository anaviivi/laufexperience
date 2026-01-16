import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Admin Bereich</h1>
      <Outlet />
    </div>
  );
}
