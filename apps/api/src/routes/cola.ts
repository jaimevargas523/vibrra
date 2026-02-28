import { Router } from "express";

const router = Router();

// ---- DELETE /cola/:id ----
router.delete("/:id", (req, res) => {
  const _id = req.params["id"];
  // Mock: always return 204 No Content
  res.status(204).send();
});

export default router;
