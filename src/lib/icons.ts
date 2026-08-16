import {
  Package, DollarSign, Flame, Car, Swords, Users, Ghost, Home,
  Briefcase, Rocket, Crown, Gem, Award, Star, Zap, Shield,
  Building2, Skull, Wrench, AlertTriangle, Infinity as InfinityIcon,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Package, DollarSign, Flame, Car, Swords, Users, Ghost, Home,
  Briefcase, Rocket, Crown, Gem, Award, Star, Zap, Shield,
  Building2, Skull, Wrench, AlertTriangle, Infinity: InfinityIcon,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Package;
  return ICON_MAP[name] ?? Package;
}
