const ROLE_ICONS: Record<string, string> = {
  rusher: "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_rusher_role_player.png",
  bomber: "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_bomber_role_player.png",
  support: "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_support_role_player.png",
  sniper: "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_sniper_role_player.png",
};

export function roleIcon(role: string): string | undefined {
  return ROLE_ICONS[role.trim().toLowerCase()];
}

export function roleLabel(role: string): string {
  return role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "Player";
}