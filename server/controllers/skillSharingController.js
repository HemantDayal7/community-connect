const SkillSharing = require("../models/SkillSharing");

// ✅ Get all skill-sharing listings
exports.getAllSkillSharings = async (req, res) => {
  try {
    const skills = await SkillSharing.find();
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Create a new skill listing
exports.createSkillSharing = async (req, res) => {
  const { skillName, description, userId } = req.body;
  try {
    const skill = new SkillSharing({ skillName, description, userId });
    await skill.save();
    res.status(201).json({ message: "Skill listing created successfully", skill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get a single skill listing
exports.getSkillSharingById = async (req, res) => {
  try {
    const skill = await SkillSharing.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found" });
    }
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update a skill listing
exports.updateSkillSharing = async (req, res) => {
  try {
    const skill = await SkillSharing.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found" });
    }
    Object.assign(skill, req.body);
    await skill.save();
    res.json({ message: "Skill listing updated successfully", skill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete a skill listing
exports.deleteSkillSharing = async (req, res) => {
  try {
    const skill = await SkillSharing.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found" });
    }
    await skill.deleteOne();
    res.json({ message: "Skill listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
