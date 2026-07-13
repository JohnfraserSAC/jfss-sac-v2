const STATUS_LABELS = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  const tone = String(status || "unknown")
    .toLowerCase()
    .replace(/_/g, "-");

  return (
    <span className={`badge badge--status badge--${tone}`}>
      <span className="badge__label" aria-hidden="true">
        {label}
      </span>
      <span className="sr-only">Status: {label}</span>
    </span>
  );
}
