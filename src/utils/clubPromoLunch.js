export const PROMO_LUNCH_DAYS = [
  { value: "OCTOBER_1", label: "October 1st" },
  { value: "OCTOBER_2", label: "October 2nd" },
  { value: "BOTH", label: "Both" },
];

export function getPromoLunchDaysLabel(value) {
  return PROMO_LUNCH_DAYS.find((day) => day.value === value)?.label || value || "—";
}

export function validateClubPromoLunchForm(values) {
  const errors = {};
  const boothDays = String(values.boothDays || "").trim();
  const representatives = String(values.representatives || "").trim();

  if (!PROMO_LUNCH_DAYS.some((day) => day.value === boothDays)) {
    errors.boothDays = "Choose which days your club will run a booth.";
  }
  if (values.approvalEmailReceived !== true && values.approvalEmailReceived !== false) {
    errors.approvalEmailReceived = "Choose Yes or No.";
  }
  if (representatives.length < 2 || representatives.length > 5000) {
    errors.representatives =
      "Provide at least one representative name and student email.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      boothDays,
      approvalEmailReceived: values.approvalEmailReceived,
      representatives,
    },
  };
}
