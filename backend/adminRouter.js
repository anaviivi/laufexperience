import express from "express";

const router = express.Router();

// Demo-Daten (damit es sofort funktioniert)
const roles = [
  { id: "admin", name: "Admin", description: "Vollzugriff" },
  { id: "editor", name: "Editor", description: "Inhalte" },
  { id: "user", name: "User", description: "Normaler User" },
  { id: "viewer", name: "Viewer", description: "Nur ansehen" },
  { id: "moderator", name: "Moderator", description: "Moderation" },
];

let users = [
  { id: "1", name: "Admin", email: "admin@example.com", roleId: "admin" },
  { id: "2", name: "Editor", email: "editor@example.com", roleId: "editor" },
  { id: "3", name: "User", email: "user@example.com", roleId: "user" },
  { id: "4", name: "Ich", email: "DEINE_EMAIL.DE", roleId: "user" },
  { id: "4", name: "Ich", email: "DEINE_EMAIL.DE", roleId: "user" },
];

router.get("/_ping", (req, res) => res.json({ ok: true }));

router.get("/roles", (req, res) => res.json({ roles }));

router.get("/users", (req, res) => {
  res.json({ canManage: true, users });
});

router.put("/users/:userId/role", (req, res) => {
  const userId = String(req.params.userId || "").trim();
  const roleId = String(req.body?.roleId || "").trim();
  if (!userId || !roleId) return res.status(400).json({ error: "missing_userId_or_roleId" });

  const roleOk = roles.some((r) => r.id === roleId);
  if (!roleOk) return res.status(400).json({ error: "invalid_role" });

  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return res.status(404).json({ error: "user_not_found" });

  users[idx] = { ...users[idx], roleId };
  res.json({ userId, roleId });
});

export default router;
