const express = require("express");
const BookingController = require("../controllers/booking.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, BookingController.list);
router.post("/", authMiddleware, BookingController.create);
router.patch("/:id/status", authMiddleware, BookingController.updateStatus);

module.exports = router;

