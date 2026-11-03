// Shared validation rules (web + mobile).
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());
export const isMobile = (v) => /^[6-9]\d{9}$/.test((v || '').trim()); // 10-digit Indian mobile
export const isOtp = (v) => /^\d{6}$/.test((v || '').trim());

export function validateLogin(mode, identifier, password) {
  if (mode === 'email' && !isEmail(identifier)) return 'Enter a valid email address';
  if (mode === 'mobile' && !isMobile(identifier)) return 'Enter a valid 10-digit mobile number';
  if (!password) return 'Enter your password';
  return null;
}

export function validateNewPassword(pw, confirm) {
  if (!pw || pw.length < 8) return 'New password must be at least 8 characters';
  if (pw !== confirm) return 'Passwords do not match';
  return null;
}

export const emptyCommodity = {
  name: '', hsnCode: '', rate: '', rateUnit: '', prefix: '', deductionEnabled: false, hamaliEnabled: false,
};

// Convert form values to the API payload
export function toCommodityPayload(f) {
  return {
    name: f.name.trim(),
    hsnCode: f.hsnCode || null,
    rate: f.rate === '' || f.rate == null ? null : Number(f.rate),
    rateUnit: f.rateUnit || null,
    prefix: f.prefix || null,
    deductionEnabled: !!f.deductionEnabled,
    hamaliEnabled: !!f.hamaliEnabled,
  };
}
