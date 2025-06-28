import { Router } from "express";

const appRoutes = Router();

appRoutes.get("/test", (req, res) => {
  res.send("Hello from the App API!");
});

export default appRoutes;