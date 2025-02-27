import SkillSharing from "../../models/SkillSharing.js";
import { validationResult } from "express-validator";

/**
 * @desc Get all skill-sharing listings
 * @route GET /api/v1/skillsharings
 * @access Public
 */
export const getAllSkillSharings = async (req, res) => {
  try {
    const skills = await SkillSharing.find().populate("userId", "name email");
    res.status(200).json(skills);
  } catch (error) {
    console.error("🔥 Error fetching skill sharings:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Create a new skill listing
 * @route POST /api/v1/skillsharings
 * @access Private
 */
export const createSkillSharing = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log("📌 Received skill data:", req.body);

    const { title, description, location, availability } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    const skill = new SkillSharing({
      title, // ✅ Now matches the updated model
      description,
      location,
      availability,
      userId: req.user._id,
    });

    await skill.save();
    res.status(201).json({ message: "✅ Skill listing created successfully", skill });
  } catch (error) {
    console.error("🔥 Error creating skill listing:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Get a single skill listing
 * @route GET /api/v1/skillsharings/:id
 * @access Public
 */
export const getSkillSharingById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const skill = await SkillSharing.findById(req.params.id).populate("userId", "name email");
    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found" });
    }
    res.status(200).json(skill);
  } catch (error) {
    console.error("🔥 Error fetching skill listing:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Update a skill listing (Only owner can update)
 * @route PUT /api/v1/skillsharings/:id
 * @access Private
 */
export const updateSkillSharing = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const skill = await SkillSharing.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found" });
    }

    if (skill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized: You cannot update this skill listing" });
    }

    Object.assign(skill, req.body);
    await skill.save();
    res.status(200).json({ message: "✅ Skill listing updated successfully", skill });
  } catch (error) {
    console.error("🔥 Error updating skill listing:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Delete a skill listing (Only owner can delete)
 * @route DELETE /api/v1/skillsharings/:id
 * @access Private
 */
export const deleteSkillSharing = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const skill = await SkillSharing.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found" });
    }

    if (!req.user || skill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized: You cannot delete this skill listing" });
    }

    await skill.deleteOne();
    res.status(200).json({ message: "✅ Skill listing deleted successfully" });
  } catch (error) {
    console.error("🔥 Error deleting skill listing:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
