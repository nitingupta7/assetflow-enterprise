// ─── Department Routes ───────────────────────────────
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { createDepartment, getDepartments, updateDepartment, deleteDepartment } = require("../controllers/department.controller");

router.use(auth); // All department routes require authentication

router.post("/", authorize("ADMIN"), createDepartment);
router.get("/", getDepartments); // Any authenticated user can view
router.patch("/:id", authorize("ADMIN"), updateDepartment);
router.delete("/:id", authorize("ADMIN"), deleteDepartment);

module.exports = router;
