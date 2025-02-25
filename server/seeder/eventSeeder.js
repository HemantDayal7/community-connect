import Event from "../models/Event.js";
import User from "../models/User.js";

const seedEvents = async () => {
  try {
    const user = await User.findOne(); // Get an existing user for hostId
    if (!user) throw new Error("No users found. Ensure users are seeded first.");

    const events = [
      {
        title: "Community Cleanup Drive",
        date: new Date(),
        location: "Central Park",
        hostId: user._id, // ✅ Use valid hostId
      },
      {
        title: "Local Tech Meetup",
        date: new Date(),
        location: "Tech Hub",
        hostId: user._id, // ✅ Use valid hostId
      },
    ];

    await Event.insertMany(events);
    console.log("✅ Events Seeded!");
  } catch (error) {
    console.error("❌ Error Seeding Events:", error);
  }
};

export default seedEvents;
