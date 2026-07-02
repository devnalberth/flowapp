import {
  UtensilsCrossed,
  ShoppingCart,
  Home,
  Car,
  Plane,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Briefcase,
  Wallet,
  Laptop,
  TrendingUp,
  Landmark,
  Zap,
  Repeat,
  Wrench,
  Package,
  Gift,
  Coffee,
  PawPrint,
  Smartphone,
  Pill,
  Clapperboard,
  Tag,
} from 'lucide-react'
import './CategoryIcon.css'

// Mapa slug de categoria → ícone Lucide (categorias padrão do app)
const ICON_BY_SLUG = {
  alimentacao: UtensilsCrossed,
  assinatura: Repeat,
  casa: Home,
  compras: ShoppingBag,
  educacao: GraduationCap,
  lazer: Gamepad2,
  operacao_bancaria: Landmark,
  pix: Zap,
  saude: HeartPulse,
  servicos: Wrench,
  supermercado: ShoppingCart,
  transporte: Car,
  viagem: Plane,
  salario: Wallet,
  freelance: Laptop,
  investimentos: TrendingUp,
  outros: Package,
}

// Mapa emoji (paleta do editor de categorias) → ícone Lucide, para categorias custom
export const ICON_BY_EMOJI = {
  '🍽️': UtensilsCrossed,
  '🛒': ShoppingCart,
  '🏠': Home,
  '🚗': Car,
  '✈️': Plane,
  '🎮': Gamepad2,
  '🎓': GraduationCap,
  '❤️': HeartPulse,
  '🛍️': ShoppingBag,
  '💼': Briefcase,
  '💰': Wallet,
  '💻': Laptop,
  '📈': TrendingUp,
  '🏦': Landmark,
  '⚡': Zap,
  '🔁': Repeat,
  '🛠️': Wrench,
  '📦': Package,
  '🎁': Gift,
  '☕': Coffee,
  '🐾': PawPrint,
  '📱': Smartphone,
  '💊': Pill,
  '🍿': Clapperboard,
}

export function resolveCategoryIcon(slug, emoji) {
  return ICON_BY_SLUG[slug] || ICON_BY_EMOJI[emoji] || null
}

// Tile de categoria: fundo tintado com a cor da categoria + ícone na cor cheia
// (contraste correto sobre cards brancos, sem emoji "achatado" em fundo sólido).
export default function CategoryIcon({ slug, icon, color = '#6b7280', size = 32, className = '' }) {
  const Icon = resolveCategoryIcon(slug, icon)
  return (
    <span
      className={`categoryIcon ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: `${color}1a`,
        color,
      }}
    >
      {Icon
        ? <Icon size={Math.round(size * 0.56)} strokeWidth={2.2} />
        : icon
          ? <span className="categoryIcon__emoji" style={{ fontSize: Math.round(size * 0.5) }}>{icon}</span>
          : <Tag size={Math.round(size * 0.56)} strokeWidth={2.2} />}
    </span>
  )
}
