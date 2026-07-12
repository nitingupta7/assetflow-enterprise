// ─── Asset Routes ────────────────────────────────────
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { createAsset, getAssets, getAssetById, updateAsset, deleteAsset } = require("../controllers/asset.controller");

router.use(auth); // All asset routes require authentication

router.post("/", authorize("ADMIN", "ASSET_MANAGER"), createAsset);
router.get("/", getAssets); // Any authenticated user can view
router.get("/:id", getAssetById);
router.patch("/:id", authorize("ADMIN", "ASSET_MANAGER"), updateAsset);
router.delete("/:id", authorize("ADMIN"), deleteAsset);

module.exports = router;
