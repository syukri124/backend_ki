const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleCheck");

router.post("/", verifyToken, requireRole([2]), controller.createProduct);
router.get("/", verifyToken, requireRole([2]), controller.getProducts);
router.get("/:id", verifyToken, requireRole([2]), controller.getProductById);
router.put("/:id", verifyToken, requireRole([2]), controller.updateProduct);
router.delete("/:id", verifyToken, requireRole([2]), controller.deleteProduct);


module.exports = router;
