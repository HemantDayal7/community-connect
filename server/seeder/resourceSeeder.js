import Resource from "../models/Resource.js";
import User from "../models/User.js";

const seedResources = async () => {
  try {
    const user = await User.findOne(); // Get an existing user
    if (!user) throw new Error("No users found. Ensure users are seeded first.");

    const resources = [
      {
        title: "Projector",
        description: "A high-quality projector available for community events.",
        ownerId: user._id, // ✅ Assign a valid user
        availability: "available", // ✅ Use correct enum value
        location: "Downtown Library",
      },
      {
        title: "Shared Workspace",
        description: "Co-working space for freelancers and students.",
        ownerId: user._id, // ✅ Assign a valid user
        availability: "not available", // ✅ Use correct enum value
        location: "Startup Hub",
      },
    ];

    await Resource.insertMany(resources);
    console.log("✅ Resources Seeded!");
  } catch (error) {
    console.error("❌ Error Seeding Resources:", error);
  }
};

export default seedResources;
