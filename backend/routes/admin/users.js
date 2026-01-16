import express from "express";
import { supabaseAdmin } from "../../supabaseAdmin.js";

const router = express.Router();

// GET /admin/users -> list Supabase Auth users
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ users: data.users });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
