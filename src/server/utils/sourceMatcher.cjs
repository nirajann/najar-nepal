function normalizeText(value = "") {
  return String(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreSourceAgainstKeywords(text = "", keywords = []) {
  const cleanText = normalizeText(text);
  const cleanKeywords = keywords.map(normalizeText).filter(Boolean);

  const matchedKeywords = cleanKeywords.filter((keyword) =>
    cleanText.includes(keyword)
  );

  const relevanceScore =
    cleanKeywords.length > 0 ? matchedKeywords.length / cleanKeywords.length : 0;

  return {
    matchedKeywords,
    relevanceScore: Number(relevanceScore.toFixed(2)),
  };
}

function computeFinalStatus(project) {
  const manualStatus = project.manualStatus || "NOT_STARTED";

  if (!project.allowAutoStatus) return manualStatus;
  if (manualStatus === "COMPLETED") return "COMPLETED";
  if (manualStatus === "STALLED") return "STALLED";

  const sourceCount = project.sourceCount || 0;

  if (!project.dueDate) {
    return sourceCount > 0 ? "IN_PROGRESS" : manualStatus;
  }

  const today = new Date();
  const due = new Date(project.dueDate);

  if (today > due && manualStatus !== "COMPLETED") {
    return "BROKEN";
  }

  if (sourceCount > 0) {
    return "IN_PROGRESS";
  }

  return "NOT_STARTED";
}

function getDaysText(dueDate) {
  if (!dueDate) return "No deadline";

  const today = new Date();
  const due = new Date(dueDate);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 0) return "Due today";
  return `${diffDays} days left`;
}

module.exports = {
  normalizeText,
  scoreSourceAgainstKeywords,
  computeFinalStatus,
  getDaysText,
};