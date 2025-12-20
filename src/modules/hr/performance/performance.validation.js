// Minimal validation helpers for performance endpoints
export function validateReviewPayload(payload) {
  const errors = [];
  if (!payload.employee_id) errors.push('employee_id is required');
  return errors;
}

export function validateFeedbackPayload(payload) {
  const errors = [];
  if (!payload.from_employee_id) errors.push('from_employee_id is required');
  if (!payload.to_employee_id) errors.push('to_employee_id is required');
  if (!payload.content) errors.push('content is required');
  return errors;
}
