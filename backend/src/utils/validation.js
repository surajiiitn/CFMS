import validator from "validator";

const collegeEmailRegex =
  process.env.COLLEGE_EMAIL_REGEX || "^[^\\s@]+@[^\\s@]+\\.(edu|ac\\.in)$";

export const isCollegeEmail = (email) => {
  if (!email || !validator.isEmail(email)) return false;
  return new RegExp(collegeEmailRegex, "i").test(email);
};

export const sanitizeSkillList = (skills) => {
  if (!Array.isArray(skills)) return [];
  const unique = new Set();
  for (const skill of skills) {
    const trimmed = String(skill || "").trim();
    if (trimmed) unique.add(trimmed.slice(0, 50));
  }
  return Array.from(unique);
};

export const isValidUrlOrEmpty = (value) => {
  if (!value) return true;
  return validator.isURL(value, { require_protocol: true });
};
