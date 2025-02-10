const SkillSharing = require("../models/SkillSharing");

// ✅ Create a new skill-sharing entry
exports.createSkillSharing = async (req, res) => {
  try {
    const { skillName, description, availability, location } = req.body;

    if (!skillName || !description || !location) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const skillSharing = new SkillSharing({
      userId: req.user._id,
      skillName,
      description,
      availability,
      location,
    });

    await skillSharing.save();
    res.status(201).json(skillSharing);
  } catch (error) {
    console.error("Error creating skill sharing:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Get all skill-sharing entries
exports.getAllSkillSharings = async (req, res) => {
  try {
    const skillSharings = await SkillSharing.find({ isDeleted: false }).populate("userId", "name email");
    res.status(200).json(skillSharings);
  } catch (error) {
    console.error("Error fetching skill sharings:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Get a specific skill-sharing entry by ID
exports.getSkillSharingById = async (req, res) => {
  try {
    const skillSharing = await SkillSharing.findOne({ _id: req.params.id, isDeleted: false }).populate("userId", "name email");

    if (!skillSharing) {
      return res.status(404).json({ msg: "Skill sharing entry not found" });
    }

    res.status(200).json(skillSharing);
  } catch (error) {
    console.error("Error fetching skill sharing:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Update a skill-sharing entry
exports.updateSkillSharing = async (req, res) => {
  try {
    const skillSharing = await SkillSharing.findOne({ _id: req.params.id, userId: req.user._id });

    if (!skillSharing) {
      return res.status(404).json({ msg: "Skill sharing entry not found" });
    }

    Object.assign(skillSharing, req.body);
    await skillSharing.save();

    res.status(200).json(skillSharing);
  } catch (error) {
    console.error("Error updating skill sharing:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Soft delete a skill-sharing entry
exports.deleteSkillSharing = async (req, res) => {
  try {
    const skillSharing = await SkillSharing.findOne({ _id: req.params.id, userId: req.user._id });

    if (!skillSharing) {
      return res.status(404).json({ msg: "Skill sharing entry not found" });
    }

    skillSharing.isDeleted = true;
    await skillSharing.save();

    res.status(200).json({ msg: "Skill sharing entry deleted" });
  } catch (error) {
    console.error("Error deleting skill sharing:", error);
    res.status(500).json({ msg: "Server error" });
  }
};
