// Add this route if it doesn't exist

router.put('/complete-by-skill/:skillId', protect, completeSkillRequestBySkillId);