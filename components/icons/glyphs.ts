// netudu simge seti: 24x24 ızgara, 1.75 çizgi, yuvarlak uç ve köşe, >=1 birim güvenli kenar.
// Tek kaynak: ad -> SVG iç içeriği. React bileşenleri (index.tsx) ve önizleme betiği aynı veriyi okur.
// İmza (logodan türeyen üç kural; tüm sete aynı ölçüyle uygulanır):
//   K1 KALEM UCU KÖŞESİ: kapalı çerçeveli simgelerde (kalkanlar hariç) üç köşe r=3.5 yuvarlak, sağ alt köşe
//      45 derece düz pahla kesilir (kesim 4.5 birim): F() yardımcısı. Pahın içine iç öğe taşmaz.
//   K2 MÜREKKEP NOKTASI: simge başına en fazla BİR dolu nokta (D(), class="nd-ink", r=1.3): kalemin kâğıda
//      değdiği doğal odak (ok çıkışı, onay başı, saat merkezi, hedef, mercek sapı, zil tokmağı, çizgi ucu).
//      CSS'te --icon-ink ile kobalt olabilir. Saf işaretlerde (artı, eksi, çarpı, ok başı, menü) yoktur;
//      GripVertical/MoreHorizontal noktaları içeriğin kendisidir (nd-ink değil).
//   K3 DEFTER SEKMELERİ: belge/kayıt ailesinde (FileText, FileSpreadsheet, NotebookPen, Copy ön yaprağı)
//      sol kenardan 1.5 birim dışarı taşan, yuvarlak uçlu 2-3 kısa çizgi.
const P = (d: string) => `<path d="${d}"/>`
const C = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`
const R = (x: number, y: number, w: number, h: number, r: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`
// K1: üç köşe r yuvarlak, sağ alt köşe c birimlik 45 derece pah.
const F = (x: number, y: number, w: number, h: number, r = 3.5, c = 4.5) =>
  P(`M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - c}L${x + w - c} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`)
// K2: mürekkep noktası (tek, nd-ink).
const D = (x: number, y: number, r = 1.3) => `<circle class="nd-ink" cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`
// Düz nokta (içeriğin kendisi; mürekkep değil): GripVertical, MoreHorizontal.
const Dp = (x: number, y: number, r = 1.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`

const clockHands = P("M12 7.5V12l3 1.8")
const bellBody = P("M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5Z") + D(12, 21.2)
const eyeShape = P("M2.5 12c2-4 5.3-6.5 9.5-6.5s7.5 2.5 9.5 6.5c-2 4-5.3 6.5-9.5 6.5S4.5 16 2.5 12Z")
const calFrame = F(3, 4.5, 18, 16.5) + P("M3 9.5h18M8 3v3M16 3v3")
const docFrame = F(4.5, 3, 15, 18) + P("M3 8h1.5M3 12h1.5M3 16h1.5")
const cylinderTop = P("M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z")

export const GLYPHS = {
  AlarmClock: C(12, 13.5, 7.5) + P("M12 9.5v4l2.4 1.5M4 5.2L7 3M20 5.2L17 3") + D(12, 13.5),
  AlarmClockOff: C(12, 13.5, 7.5) + P("M12 9.5v4l2.4 1.5M4 5.2L7 3M20 5.2L17 3M3.5 3.5l17 17") + D(12, 13.5),
  AlertCircle: C(12, 12, 9) + P("M12 7.5v5") + D(12, 16),
  AlertTriangle: P("M12 4L21 19.5H3Z") + P("M12 9.5v4.5") + D(12, 17),
  ArrowDown: P("M12 4.5v15M6 13.5l6 6 6-6") + D(12, 4.5),
  ArrowLeft: P("M19.5 12h-15M10.5 6l-6 6 6 6") + D(19.5, 12),
  ArrowRight: P("M4.5 12h15M13.5 6l6 6-6 6") + D(4.5, 12),
  ArrowUpRight: P("M7 17L17 7M8.5 7H17v8.5") + D(7, 17),
  Bell: bellBody,
  BellRing: bellBody + P("M2.8 10c0-2.4.8-4.4 2.3-6M21.2 10c0-2.4-.8-4.4-2.3-6"),
  BookOpen: P("M12 6.5C10.3 5 8 4.5 4.5 4.5a1 1 0 0 0-1 1V17a1 1 0 0 0 1 1c3.5 0 5.7.5 7.5 2 1.8-1.5 4-2 7.5-2a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1C16 4.5 13.7 5 12 6.5ZM12 6.5V20"),
  Building2: F(5, 3, 14, 18) + P("M9 8h6M9 12h6M8 21v-3.5h3V21"),
  CalendarClock: calFrame + P("M12 12.2V16.4l2.8 1.6") + D(12, 16.4),
  CalendarDays: calFrame + P("M7 13.5h2M11 13.5h2M15 13.5h2M7 17h2M11 17h2") + D(16, 17),
  CalendarPlus: calFrame + P("M12 12.8v5.4M9.3 15.5h5.4"),
  Camera: F(3, 6.5, 18, 13.5) + P("M8 6.5l1.2-2.3h5.6L16 6.5") + C(12, 13.2, 3.5) + D(12, 13.2),
  ChartNoAxesCombined: P("M5.5 20.5v-5M12 20.5v-9M18.5 20.5v-6M3.5 9.5L9 5.5l4 3 7.5-5") + D(20.5, 3.5),
  Check: P("M5 12.5l4.5 4.5L19 7.5") + D(5, 12.5),
  ChevronDown: P("M6 9.5l6 6 6-6"),
  ChevronLeft: P("M14.5 6l-6 6 6 6"),
  ChevronRight: P("M9.5 6l6 6-6 6"),
  ChevronUp: P("M6 14.5l6-6 6 6"),
  CircleCheck: C(12, 12, 9) + P("M8 12.5l2.7 2.7L16 9.5") + D(8, 12.5),
  CircleHelp: C(12, 12, 9) + P("M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1.9-1.1 1.6") + D(12, 16.8),
  Circle: C(12, 12, 9),
  Clock: C(12, 12, 9) + clockHands + D(12, 12),
  Coffee: P("M5 9h11v6a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 15Z") + P("M16 10.5h1.2a2.8 2.8 0 0 1 0 5.6H16M8.5 3.5V6M12 3.5V6"),
  Copy: F(8.5, 8.5, 12.5, 12.5) + P("M15.5 8.5V7A3.5 3.5 0 0 0 12 3.5H7A3.5 3.5 0 0 0 3.5 7v4.5M7 14.5h1.5M7 17h1.5"),
  Database: cylinderTop + P("M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"),
  DatabaseBackup: cylinderTop + P("M4 6v10c0 1.2 1.8 2.2 4.4 2.7M20 6v3.5M4 11c0 1.2 1.8 2.2 4.4 2.7") + P("M13 14.5A4.7 4.7 0 1 1 13.6 19.4M13 11.5v3h3"),
  Dna: P("M8 3c0 6 8 6 8 12v6M16 3c0 6-8 6-8 12v6M9.3 6.5h5.4M9.3 17.5h5.4"),
  Download: P("M12 4v11M7 10.5l5 5 5-5M4.5 19.5h15") + D(12, 4),
  ExternalLink: P("M13.5 4.5h6v6M19.5 4.5l-8 8M17.5 14v1l-4.5 4.5H7A3.5 3.5 0 0 1 3.5 16V8A3.5 3.5 0 0 1 7 4.5H10") + D(11.5, 12.5),
  Eye: eyeShape + C(12, 12, 3),
  EyeOff: eyeShape + C(12, 12, 3) + P("M4 4l16 16"),
  FileSpreadsheet: docFrame + P("M8.5 9.5h8M8.5 13.5h8M12.5 9.5v8"),
  FileText: docFrame + P("M9 8.5h7M9 12.5h7M9 16.5h2.5") + D(14.8, 16.5),
  Flag: P("M5.5 21V4M5.5 4.5h12l-2.4 4 2.4 4h-12"),
  Flame: P("M12 3c.6 3.3 4.7 5.4 4.7 10.3a4.7 4.7 0 0 1-9.4 0c0-1.8.7-3 1.7-4 .2 1.3.8 2 1.6 2.2-.5-3.2.4-5.4 1.4-8.5Z"),
  FlaskConical: P("M9.5 3h5M10.5 3v6L5 18.2A2 2 0 0 0 6.7 21h10.6a2 2 0 0 0 1.7-2.8L13.5 9V3M7.5 15h9"),
  FolderTree: F(3, 3.5, 18, 17) + P("M7.5 8v8.5M7.5 12.5h5.5M7.5 16.5h4M11 8h5.5") + D(7.5, 8),
  Globe: C(12, 12, 9) + P("M3 12h18M12 3c2.8 2.6 4 5.6 4 9s-1.2 6.4-4 9c-2.8-2.6-4-5.6-4-9s1.2-6.4 4-9Z"),
  GraduationCap: P("M2.5 9.5L12 5l9.5 4.5L12 14ZM6.5 11.8V16c0 1.6 2.4 3 5.5 3s5.5-1.4 5.5-3v-4.2M21.5 9.5V15"),
  GripVertical: Dp(9, 6) + Dp(15, 6) + Dp(9, 12) + Dp(15, 12) + Dp(9, 18) + Dp(15, 18),
  History: P("M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5M3.5 4v4.5H8") + clockHands + D(12, 12),
  House: P("M3 11L12 3.8 21 11M4.5 9.5V17A3.5 3.5 0 0 0 8 20.5h7l4.5-4.5V9.5") + D(12, 15),
  ImagePlus: P("M20.5 12v4L16 20.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5H12M3.5 17.5l5-5 3.5 3.5 2-2 3 3M17.5 3v6M14.5 6h6") + D(8.5, 8.5),
  Images: F(6.5, 6.5, 14.5, 14.5) + P("M3.5 14.5V7A3.5 3.5 0 0 1 7 3.5h8.5M7.5 18l3.5-3.5 3 3 2.5-2.5") + D(11.5, 11),
  Info: C(12, 12, 9) + P("M12 11v5.5") + D(12, 7.8),
  KeyRound: C(8.5, 15.5, 4.5) + P("M11.7 12.3L20.5 3.5M17 7l2.5 2.5M14.5 9.5l2 2") + D(20.5, 3.5),
  LayoutDashboard: R(3, 3, 8, 10, 2.5) + R(13, 3, 8, 6, 2.5) + F(13, 11, 8, 10, 2.5) + R(3, 15, 8, 6, 2.5),
  List: P("M9.5 6.5H20M4.5 12H20M4.5 17.5H15") + D(4.8, 6.5),
  Loader: P("M21 12a9 9 0 1 1-6.2-8.55"),
  LogIn: P("M14 4.5h3.5A3.5 3.5 0 0 1 21 8v7l-4.5 4.5H14M3.5 12h11M10.5 8l4 4-4 4") + D(3.5, 12),
  LogOut: P("M10 4.5H6.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3H10M9.5 12h11M16.5 8l4 4-4 4") + D(9.5, 12),
  Mail: F(3, 5, 18, 14) + P("M3.5 8.5L12 14l8.5-5.5"),
  Map: P("M3.5 6.5L9 4l6 2.5L20.5 4v13L15 19.5 9 17l-5.5 2.5ZM9 4v13M15 6.5v13") + D(12, 11.5),
  Menu: P("M4 7h16M4 12h16M4 17h10"),
  Minus: P("M5 12h14"),
  Monitor: F(3, 4, 18, 12.5) + P("M9 20.5h6M12 16.5v4"),
  Moon: P("M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z"),
  MoreHorizontal: Dp(5, 12, 1.5) + Dp(12, 12, 1.5) + Dp(19, 12, 1.5),
  NotebookPen: P("M17 7.6V6.5A3.5 3.5 0 0 0 13.5 3h-6A3.5 3.5 0 0 0 4 6.5v11A3.5 3.5 0 0 0 7.5 21h5L17 16.5v-3.2M2.5 8.5H4M2.5 12.5H4M2.5 16.5H4") + P("M11.1 15.7l.7-3L17.5 7a1.7 1.7 0 0 1 2.4 2.4l-5.7 5.7Z") + D(11.1, 15.7),
  OctagonX: P("M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7ZM9.5 9.5l5 5M14.5 9.5l-5 5"),
  PanelLeft: F(3, 3.5, 18, 17) + P("M9.5 3.5v17"),
  Pin: P("M9 3.5h6l-.8 5.5 3.3 4H6.5L9.8 9ZM12 13.5v7.5"),
  Play: P("M8 5.5v13l11-6.5Z"),
  Plus: P("M12 5v14M5 12h14"),
  PlusCircle: C(12, 12, 9) + P("M12 8v8M8 12h8"),
  Printer: P("M7.5 8.5V5a1.2 1.2 0 0 1 1.2-1.2h6.6A1.2 1.2 0 0 1 16.5 5v3.5") + P("M7.5 18.5H6.5A3.5 3.5 0 0 1 3 15v-3a3.5 3.5 0 0 1 3.5-3.5h11A3.5 3.5 0 0 1 21 12v2l-4.5 4.5h-2M7.5 14.5v6h7v-6") + D(17, 12),
  RefreshCw: P("M20 12a8 8 0 0 0-13.5-5.8L4 8.5M4 4.5v4h4M4 12a8 8 0 0 0 13.5 5.8L20 15.5M20 19.5v-4h-4"),
  RotateCcw: P("M4 12a8 8 0 1 0 2.5-5.8L4 8.5M4 4.5v4h4"),
  School: P("M3.5 10.5L12 4.5l8.5 6ZM6 10.5v10M18 10.5v10M3 20.5h18M10 20.5v-4a2 2 0 0 1 4 0v4") + D(12, 8.3),
  Search: C(10.5, 10.5, 6.5) + P("M15.5 15.5L20 20") + D(20, 20),
  Send: P("M20.5 3.5l-17 7 6.5 2.5 2.5 6.5ZM10 13l10.5-9.5") + D(10, 13),
  Settings: P("M4 7h8M18 7h2M4 17h2M12 17h8") + C(15, 7, 2.5) + C(9, 17, 2.5),
  ShieldAlert: P("M12 3l7.5 3v5.5c0 4.7-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.8-7.5-9.5V6ZM12 8.5v4") + D(12, 15.6),
  ShieldCheck: P("M12 3l7.5 3v5.5c0 4.7-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.8-7.5-9.5V6ZM8.8 12l2.4 2.4 4-4.4") + D(8.8, 12),
  Sigma: P("M18 5H7l6 7-6 7h11"),
  Sparkles: P("M11 3.5Q11.7 10.3 18.5 11Q11.7 11.7 11 18.5Q10.3 11.7 3.5 11Q10.3 10.3 11 3.5Z") + P("M19 3v4M17 5h4M18.5 16.5v4M16.5 18.5h4"),
  Sun: C(12, 12, 3.8) + P("M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M18.4 5.6l-1.3 1.3M6.9 17.1l-1.3 1.3"),
  Table2: F(3, 4, 18, 16) + P("M3 9.5h18M9.5 9.5V20"),
  Target: C(12, 12, 9) + C(12, 12, 5) + D(12, 12, 1.4),
  Terminal: F(3, 4, 18, 16) + P("M7.5 9.5l3 2.5-3 2.5M13 15h4"),
  ThumbsDown: P("M7 4.5v9l3.5 7a2.5 2.5 0 0 0 2.5-2.5v-3.5h5.2a2 2 0 0 0 2-2.3l-1-6.2a2.5 2.5 0 0 0-2.4-2ZM7 4.5H5A1.5 1.5 0 0 0 3.5 6v6A1.5 1.5 0 0 0 5 13.5h2"),
  Trash2: P("M4 6.5h16M9.5 6.5v-2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6 6.5l.8 11.7a2.5 2.5 0 0 0 2.5 2.3H13l4.5-4.5L18 6.5M10 10.5v6M14 10.5v6"),
  TrendingDown: P("M3.5 7l6 6 4-4 7 7.5M15 16.5h5.5V11") + D(3.5, 7),
  TrendingUp: P("M3.5 17l6-6 4 4 7-7.5M15 7.5h5.5V13") + D(3.5, 17),
  Umbrella: P("M3.5 12.5a8.5 8.5 0 0 1 17 0ZM12 4V2.5M12 12.5v6a2 2 0 0 1-4 0"),
  Undo2: P("M9 4.5L4.5 9 9 13.5M4.5 9H15a4.5 4.5 0 0 1 0 9h-5") + D(10, 18),
  Unplug: P("M8 3.5v4M16 3.5v4M6 7.5h12v3.5a6 6 0 0 1-12 0ZM12 17v3.5M3.5 3.5l17 17"),
  Upload: P("M12 16V4.5M7 9l5-4.5L17 9M4.5 19.5h15") + D(12, 16),
  UserPlus: C(9.5, 8, 4) + P("M2.5 20.5a7 7 0 0 1 14 0M19 8v6M16 11h6"),
  UserRound: C(12, 8, 4) + P("M4.5 20.5a7.5 7.5 0 0 1 15 0"),
  Users: C(9, 8.5, 3.5) + P("M2.5 20a6.5 6.5 0 0 1 13 0M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14a6 6 0 0 1 4 6"),
  Wand2: P("M4.5 19.5l11-11M14 7l3 3M19 2.5v4M17 4.5h4M20 11.5v3M18.5 13h3M9 2.8v2.4M7.8 4h2.4") + D(4.5, 19.5),
  X: P("M6.5 6.5l11 11M17.5 6.5l-11 11"),
  Zap: P("M13 3L5 13.5h6L10 21l9-11h-6.5Z"),
} as const

export type GlyphName = keyof typeof GLYPHS
