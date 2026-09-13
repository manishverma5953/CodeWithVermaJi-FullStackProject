export const formattedDate = (date) => {
  // Guard against empty/invalid input so we never render the Unix epoch
  // ("January 1, 1970") or "Invalid Date" for a missing value.
  if (!date) return ""
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return ""
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}
