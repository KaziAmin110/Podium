import { Router } from "express";
import { supabase } from "../utils/supabaseClient.js";
import dotenv from "dotenv";
dotenv.config();

const authRoutes = Router();

const redirectUrl = "http://localhost:3000/api/auth/callback";

authRoutes.get("/login", async (req, res) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) return res.status(500).json({ error: error.message });
  res.redirect(data.url); // send user to Google login
});

authRoutes.get("/callback", async (req, res) => {
  res.send("✅ Login successful! You can now close this tab.");
});
