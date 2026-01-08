// Minimal validation helpers for performance endpoints
export function validateReviewPayload(payload) {
  const errors = [];
  if (!payload.employee_id && !payload.employeeId) errors.push('employee_id is required');
  // If ratings provided, ensure it's an object
  const ratings = payload.ratings ?? payload.performanceRatings ?? payload.performance_ratings;
  if (ratings && typeof ratings !== 'object') errors.push('ratings must be an object');
  const goals = payload.goals;
  if (goals && !Array.isArray(goals)) errors.push('goals must be an array');
  return errors;
}

export function validateFeedbackPayload(payload) {
  const errors = [];
  if (!payload.from_employee_id) errors.push('from_employee_id is required');
  if (!payload.to_employee_id) errors.push('to_employee_id is required');
  if (!payload.content) errors.push('content is required');
  return errors;
}
