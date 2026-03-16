export const SERVICE_COLORS = [
  { key: 'red',    label: 'Kırmızı',   hex: '#EF4444', bg: '#FEE2E2', text: '#DC2626' },
  { key: 'orange', label: 'Turuncu',    hex: '#F97316', bg: '#FFEDD5', text: '#EA580C' },
  { key: 'amber',  label: 'Kehribar',   hex: '#F59E0B', bg: '#FEF3C7', text: '#D97706' },
  { key: 'green',  label: 'Yeşil',      hex: '#10B981', bg: '#D1FAE5', text: '#059669' },
  { key: 'teal',   label: 'Camgöbeği',  hex: '#14B8A6', bg: '#CCFBF1', text: '#0D9488' },
  { key: 'cyan',   label: 'Cyan',       hex: '#06B6D4', bg: '#CFFAFE', text: '#0891B2' },
  { key: 'blue',   label: 'Mavi',       hex: '#3B82F6', bg: '#DBEAFE', text: '#2563EB' },
  { key: 'indigo', label: 'İndigo',     hex: '#6366F1', bg: '#E0E7FF', text: '#4F46E5' },
  { key: 'purple', label: 'Mor',        hex: '#8B5CF6', bg: '#EDE9FE', text: '#7C3AED' },
  { key: 'pink',   label: 'Pembe',      hex: '#EC4899', bg: '#FCE7F3', text: '#DB2777' },
  { key: 'rose',   label: 'Gül',        hex: '#F43F5E', bg: '#FFE4E6', text: '#E11D48' },
  { key: 'slate',  label: 'Gri',        hex: '#64748B', bg: '#F1F5F9', text: '#475569' },
] as const;

export type ServiceColorKey = typeof SERVICE_COLORS[number]['key'];

export function getServiceColor(colorKey: string | null | undefined) {
  if (!colorKey) return null;
  return SERVICE_COLORS.find(c => c.key === colorKey) || null;
}
