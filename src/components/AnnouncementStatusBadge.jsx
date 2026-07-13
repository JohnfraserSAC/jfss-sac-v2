import { ANNOUNCEMENT_STATUS_LABELS } from "../utils/announcementPermissions";

export function AnnouncementStatusBadge({ status }) {
  const label = ANNOUNCEMENT_STATUS_LABELS[status] || status;
  const tone = String(status || "unknown")
    .toLowerCase()
    .replace(/_/g, "-");

  return (
    <span className={`badge badge--status badge--${tone}`}>
      <span aria-hidden="true">{label}</span>
      <span className="sr-only">Announcement status: {label}</span>
    </span>
  );
}
