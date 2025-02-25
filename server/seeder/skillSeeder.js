import SkillSharing from "../models/SkillSharing.js";

const seedSkills = async () => {
  try {
    await SkillSharing.deleteMany();

    const skills = [
      {
        userId: "603d2fbdaf250b1d98a2b0e9",
        skillName: "Web Development",
        description: "Can teach React and Node.js.",
        availability: "available",
        location: "Remote",
      },
      {
        userId: "603d2fbdaf250b1d98a2b0ea",
        skillName: "Guitar Lessons",
        description: "Available for beginner lessons.",
        availability: "available",
        location: "Los Angeles, CA",
      },
    ];

    await SkillSharing.insertMany(skills);
    console.log("✅ Skills Seeded!");
  } catch (error) {
    console.error("❌ Error Seeding Skills:", error);
  }
};

export default seedSkills;
