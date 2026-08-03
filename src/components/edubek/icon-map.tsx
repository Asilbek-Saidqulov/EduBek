import {
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  Coins,
  GraduationCap,
  Library,
  PenTool,
  Search,
  Shield,
  Sparkles,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

/**
 * Maps the `icon` string field from the EduBek constants
 * to the actual Lucide icon component.
 *
 * Keeping this in one place avoids importing the full Lucide
 * library and keeps the page file lean.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  Coins,
  GraduationCap,
  Library,
  PenTool,
  Search,
  Shield,
  Sparkles,
  Store,
  Users,
  Wallet,
}

export function getIcon(name: string): LucideIcon {
  const icon = ICON_MAP[name]
  if (!icon) {
    throw new Error(`Unknown icon "${name}". Add it to ICON_MAP in icon-map.tsx.`)
  }
  return icon
}
