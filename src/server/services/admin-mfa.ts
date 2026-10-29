export type AdminAal = "aal1" | "aal2" | null;

export function adminSessionRequiresMfa(currentLevel: AdminAal): boolean {
  return currentLevel !== "aal2";
}

export function adminPostLoginDestination(input: {
  role: string | null;
  isMember: boolean;
  hasVerifiedTotp: boolean;
  currentLevel: AdminAal;
}): string {
  if (input.role !== "admin" || !input.isMember) return "/admin/login?error=invalid";
  if (!input.hasVerifiedTotp) return "/admin/mfa?setup=1";
  if (adminSessionRequiresMfa(input.currentLevel)) return "/admin/mfa?challenge=1";
  return "/admin";
}
