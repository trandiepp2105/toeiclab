/** Return the requirements satisfied by a password without retaining its value. */
export function getPasswordRequirements(password = "") {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9\s]/.test(password),
  };
}

export function isPasswordPolicySatisfied(password) {
  return Object.values(getPasswordRequirements(password)).every(Boolean);
}

export const PASSWORD_POLICY_MESSAGE =
  "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ thường, chữ hoa, số và ký tự đặc biệt.";
