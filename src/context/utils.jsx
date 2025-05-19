// utils.js
export const createSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with dashes
    .replace(/^-+|-+$/g, ""); // Trim dashes from start/end
};
