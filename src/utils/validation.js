const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeClubRequestForm(values) {
  const trimOrNull = (value) => {
    const trimmed = String(value ?? "").trim();
    return trimmed === "" ? null : trimmed;
  };

  const expectedRaw = String(values.expected_member_count ?? "").trim();
  let expected_member_count = null;

  if (expectedRaw !== "") {
    const parsed = Number(expectedRaw);
    expected_member_count = Number.isFinite(parsed) ? parsed : NaN;
  }

  return {
    proposed_name: String(values.proposed_name ?? "").trim(),
    short_description: trimOrNull(values.short_description),
    description: String(values.description ?? "").trim(),
    purpose: String(values.purpose ?? "").trim(),
    faculty_advisor_name: trimOrNull(values.faculty_advisor_name),
    faculty_advisor_email: (() => {
      const email = trimOrNull(values.faculty_advisor_email);
      return email ? email.toLowerCase() : null;
    })(),
    expected_member_count,
    meeting_plan: trimOrNull(values.meeting_plan),
    constitution_url: trimOrNull(values.constitution_url),
  };
}

export function validateClubRequestForm(values) {
  const errors = {};
  const data = normalizeClubRequestForm(values);

  if (data.proposed_name.length < 2 || data.proposed_name.length > 100) {
    errors.proposed_name = "Club name must be between 2 and 100 characters.";
  }

  if (data.description.length < 10 || data.description.length > 10000) {
    errors.description =
      "Description must be between 10 and 10,000 characters.";
  }

  if (data.purpose.length < 10 || data.purpose.length > 5000) {
    errors.purpose = "Purpose must be between 10 and 5,000 characters.";
  }

  if (data.expected_member_count !== null) {
    if (
      !Number.isInteger(data.expected_member_count) ||
      data.expected_member_count < 1 ||
      data.expected_member_count > 2000
    ) {
      errors.expected_member_count =
        "Expected member count must be a whole number between 1 and 2,000.";
    }
  }

  if (
    data.faculty_advisor_email &&
    !EMAIL_PATTERN.test(data.faculty_advisor_email)
  ) {
    errors.faculty_advisor_email = "Enter a valid faculty advisor email.";
  }

  if (data.constitution_url && !isValidUrl(data.constitution_url)) {
    errors.constitution_url = "Constitution URL must be a valid http(s) link.";
  }

  return { data, errors, isValid: Object.keys(errors).length === 0 };
}

export function validateClubSlug(slug) {
  const normalized = String(slug ?? "").trim().toLowerCase();

  if (normalized.length < 2 || normalized.length > 100) {
    return "Slug must be between 2 and 100 characters.";
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(normalized)) {
    return "Slug may only use lowercase letters, numbers, and single hyphens.";
  }

  return null;
}
