// netudu özel simge seti: glyphs.ts verisinden üretilen React bileşenleri.
// Props: size (varsayılan 20), strokeWidth (1.75), className ve svg öznitelikleri; currentColor, aria-hidden.
import * as React from "react"
import { GLYPHS, type GlyphName } from "./glyphs"

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string
  strokeWidth?: number | string
}
export type Icon = (props: IconProps) => React.ReactElement

function createIcon(name: GlyphName): Icon {
  const Component: Icon = ({ size = 20, strokeWidth = 1.75, ...rest }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rest["aria-label"] ? undefined : true}
      focusable="false"
      {...rest}
      dangerouslySetInnerHTML={{ __html: GLYPHS[name] }}
    />
  )
  Component.displayName = name
  return Component
}

export const AlarmClock = createIcon("AlarmClock")
export const AlarmClockOff = createIcon("AlarmClockOff")
export const AlertCircle = createIcon("AlertCircle")
export const AlertTriangle = createIcon("AlertTriangle")
export const ArrowDownIcon = createIcon("ArrowDown")
export const ArrowLeft = createIcon("ArrowLeft")
export const ArrowRight = createIcon("ArrowRight")
export const ArrowUpRight = createIcon("ArrowUpRight")
export const Bell = createIcon("Bell")
export const BellRing = createIcon("BellRing")
export const BookOpen = createIcon("BookOpen")
export const Building2 = createIcon("Building2")
export const CalendarClock = createIcon("CalendarClock")
export const CalendarDays = createIcon("CalendarDays")
export const CalendarPlus = createIcon("CalendarPlus")
export const Camera = createIcon("Camera")
export const ChartNoAxesCombined = createIcon("ChartNoAxesCombined")
export const Check = createIcon("Check")
export const CheckIcon = createIcon("Check")
export const ChevronDown = createIcon("ChevronDown")
export const ChevronDownIcon = createIcon("ChevronDown")
export const ChevronLeft = createIcon("ChevronLeft")
export const ChevronLeftIcon = createIcon("ChevronLeft")
export const ChevronRight = createIcon("ChevronRight")
export const ChevronRightIcon = createIcon("ChevronRight")
export const ChevronUpIcon = createIcon("ChevronUp")
export const CircleCheckIcon = createIcon("CircleCheck")
export const CircleHelp = createIcon("CircleHelp")
export const CircleIcon = createIcon("Circle")
export const Clock = createIcon("Clock")
export const Coffee = createIcon("Coffee")
export const Copy = createIcon("Copy")
export const Database = createIcon("Database")
export const DatabaseBackup = createIcon("DatabaseBackup")
export const Dna = createIcon("Dna")
export const Download = createIcon("Download")
export const ExternalLink = createIcon("ExternalLink")
export const Eye = createIcon("Eye")
export const EyeOff = createIcon("EyeOff")
export const FileSpreadsheet = createIcon("FileSpreadsheet")
export const FileText = createIcon("FileText")
export const Flag = createIcon("Flag")
export const Flame = createIcon("Flame")
export const FlaskConical = createIcon("FlaskConical")
export const FolderTree = createIcon("FolderTree")
export const Globe = createIcon("Globe")
export const GraduationCap = createIcon("GraduationCap")
export const GripVerticalIcon = createIcon("GripVertical")
export const History = createIcon("History")
export const House = createIcon("House")
export const ImagePlus = createIcon("ImagePlus")
export const Images = createIcon("Images")
export const InfoIcon = createIcon("Info")
export const KeyRound = createIcon("KeyRound")
export const LayoutDashboard = createIcon("LayoutDashboard")
export const List = createIcon("List")
export const Loader2Icon = createIcon("Loader")
export const LoaderCircle = createIcon("Loader")
export const LogIn = createIcon("LogIn")
export const LogOut = createIcon("LogOut")
export const Mail = createIcon("Mail")
export const Map = createIcon("Map")
export const Menu = createIcon("Menu")
export const Minus = createIcon("Minus")
export const MinusIcon = createIcon("Minus")
export const Monitor = createIcon("Monitor")
export const Moon = createIcon("Moon")
export const MoreHorizontal = createIcon("MoreHorizontal")
export const MoreHorizontalIcon = createIcon("MoreHorizontal")
export const NotebookPen = createIcon("NotebookPen")
export const OctagonXIcon = createIcon("OctagonX")
export const PanelLeftIcon = createIcon("PanelLeft")
export const Pin = createIcon("Pin")
export const Play = createIcon("Play")
export const Plus = createIcon("Plus")
export const PlusCircle = createIcon("PlusCircle")
export const Printer = createIcon("Printer")
export const RefreshCw = createIcon("RefreshCw")
export const RotateCcw = createIcon("RotateCcw")
export const School = createIcon("School")
export const Search = createIcon("Search")
export const SearchIcon = createIcon("Search")
export const Send = createIcon("Send")
export const Settings = createIcon("Settings")
export const ShieldAlert = createIcon("ShieldAlert")
export const ShieldCheck = createIcon("ShieldCheck")
export const Sigma = createIcon("Sigma")
export const Sparkles = createIcon("Sparkles")
export const Sun = createIcon("Sun")
export const Table2 = createIcon("Table2")
export const Target = createIcon("Target")
export const Terminal = createIcon("Terminal")
export const ThumbsDown = createIcon("ThumbsDown")
export const Trash2 = createIcon("Trash2")
export const TrendingDown = createIcon("TrendingDown")
export const TrendingUp = createIcon("TrendingUp")
export const TriangleAlert = createIcon("AlertTriangle")
export const TriangleAlertIcon = createIcon("AlertTriangle")
export const Umbrella = createIcon("Umbrella")
export const Undo2 = createIcon("Undo2")
export const Unplug = createIcon("Unplug")
export const Upload = createIcon("Upload")
export const UserPlus = createIcon("UserPlus")
export const UserRound = createIcon("UserRound")
export const Users = createIcon("Users")
export const Wand2 = createIcon("Wand2")
export const X = createIcon("X")
export const XIcon = createIcon("X")
export const Zap = createIcon("Zap")
