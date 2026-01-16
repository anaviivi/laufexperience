import express from "express";

const router = express.Router();

/* =====================
   ROLE → PERMISSIONS
===================== */
const roles = [
  { id: "admin", name: "Admin", description: "Vollzugriff" },
  { id: "editor", name: "Editor", description: "Inhalte" },
  { id: "user", name: "User", description: "Normaler User" },
];

const permissionGroups = [
  {
    title: "Articles",
    perms: [
      { key: "articles.view", label: "Artikel ansehen" },
      { key: "articles.manage", label: "Artikel verwalten" },
    ],
  },
  {
    title: "Users",
    perms: [
      { key: "users.view", label: "User ansehen" },
      { key: "users.manage", label: "User verwalten" },
    ],
  },
];

const matrix = {
  admin: [
    "articles.view",
    "articles.manage",
    "users.view",
    "users.manage",
  ],
  editor: ["articles.view", "articles.manage"],
  user: ["articles.view"],
};

/* =====================
   PERMISSIONS ENDPOINTS
===================== */
router.get("/permissions", (req, res) => {
  res.json({ roles, permissionGroups, matrix });
});

router.put("/permissions/:roleId", (req, res) => {
  const { roleId } = req.params;
  if (!matrix[roleId]) return res.status(404).json({ error: "role_not_found" });

  matrix[roleId] = Array.isArray(req.body.permissions)
    ? [...new Set(req.body.permissions)]
    : [];

  res.json({ roleId, permissions: matrix[roleId] });
});

/* =====================
   USERS (ROLE ONLY)
===================== */
const users = [
  { id: "1", email: "admin@example.com", roleId: "admin" },
  { id: "2", email: "editor@example.com", roleId: "editor" },
  { id: "3", email: "user@example.com", roleId: "user" },
];

router.get("/users", (req, res) => {
  res.json({ users, roles });
});

router.put("/users/:userId/role", (req, res) => {
  const { userId } = req.params;
  const { roleId } = req.body;

  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: "user_not_found" });
  if (!roles.find((r) => r.id === roleId))
    return res.status(400).json({ error: "invalid_role" });

  user.roleId = roleId;
  res.json({ userId, roleId });
});

export default router;
