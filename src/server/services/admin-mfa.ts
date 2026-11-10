export type AdminAal = "aal1" | "aal2" | null;

// MFA enforcement is disabled while TOTP setup is pending.
// Re-enable by returning `currentLevel !== "aal2"` and restoring
// adminPostLoginDestination routing below.
// TODO(owner): re-enable once you have an authenticator app set up.
export function adminSessionRequiresMfa(_currentLevel: AdminAal): boolean {
  return false;
}

export function adminPostLoginDestination(input: {
  role: string | null;
  isMember: boolean;
  hasVerifiedTotp: boolean;
  currentLevel: AdminAal;
}): string {
  if (input.role !== "admin" || !input.isMember) return "/admin/login?error=invalid";
  // MFA step skipped while enforcement is disabled.
  return "/admin";
}
