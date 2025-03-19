import SkillSharing from "../models/SkillSharing.js";

const seedSkills = async () => {
  try {
    await SkillSharing.deleteMany();

    const skills = [
      {
        userId: "603d2fbdaf250b1d98a2b0e9",
        title: "Web Development",
        description: "Can teach React and Node.js.",
        availability: "available",
        location: "Remote",
        category: "Technology" // Add category 
      },
      {
        userId: "603d2fbdaf250b1d98a2b0ea",
        title: "Guitar Lessons",
        description: "Available for beginner lessons.",
        availability: "available",
        location: "Los Angeles, CA",
        category: "Music" // Add category
      },
    ];

    await SkillSharing.insertMany(skills);
    console.log("✅ Skills Seeded!");
  } catch (error) {
    console.error("❌ Error Seeding Skills:", error);
  }
};

export default seedSkills;
