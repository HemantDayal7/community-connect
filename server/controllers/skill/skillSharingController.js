import SkillSharing from "../../models/SkillSharing.js"; // ✅ Ensure correct import path

// ✅ Get all skill-sharing listings
export const getAllSkillSharings = async (req, res) => {
  try {
    const skills = await SkillSharing.find().populate("userId", "name email");
    res.status(200).json(skills);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Create a new skill listing
export const createSkillSharing = async (req, res) => {
  try {
    const { skillName, description, location, availability } = req.body; // ✅ Include availability

    if (!skillName || !description || !location || !availability) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const skill = new SkillSharing({
      skillName,
      description,
      location,
      availability, // ✅ Ensure availability is saved
      userId: req.user._id, // ✅ Associate skill with logged-in user
    });

    await skill.save();
    res.status(201).json({ message: "Skill listing created successfully", skill });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Get a single skill listing
export const getSkillSharingById = async (req, res) => {
  try {
    const skill = await SkillSharing.findById(req.params.id).populate("userId", "name email");
    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found" });
    }
    res.status(200).json(skill);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Update a skill listing (Only owner can update)
export const updateSkillSharing = async (req, res) => {
  try {
    const skill = await SkillSharing.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found" });
    }

    if (skill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to update this skill listing" });
    }

    Object.assign(skill, req.body);
    await skill.save();
    res.status(200).json({ message: "Skill listing updated successfully", skill });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Delete a skill listing (Only owner can delete)
export const deleteSkillSharing = async (req, res) => {
  try {
    const skill = await SkillSharing.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found" });
    }

    if (skill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this skill listing" });
    }

    await skill.deleteOne();
    res.status(200).json({ message: "Skill listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
