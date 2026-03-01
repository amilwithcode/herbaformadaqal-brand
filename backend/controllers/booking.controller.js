const Booking = require("../models/booking.model");

const list = async (req, res, next) => {
  try {
    const bookings = await Booking.listBookings();
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { programId, scheduledAt } = req.body;
    const userId = req.userId;
    if (!userId || !programId || !scheduledAt) {
      return res
        .status(400)
        .json({ message: "İstifadəçi, proqram və tarix tələb olunur" });
    }
    const booking = await Booking.createBooking({
      userId,
      programId,
      scheduledAt,
    });
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ message: "ID və status tələb olunur" });
    }
    const booking = await Booking.updateBookingStatus(id, status);
    if (!booking) {
      return res.status(404).json({ message: "Rezervasiya tapılmadı" });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  create,
  updateStatus,
};

