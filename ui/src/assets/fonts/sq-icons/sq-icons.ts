export type SqIconsId =
  | "activities"
  | "admission"
  | "calendar"
  | "checkmark"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "cross"
  | "expand"
  | "export"
  | "import"
  | "minimize"
  | "pencil"
  | "plus"
  | "quit"
  | "search"
  | "send"
  | "settings"
  | "transfers"
  | "trash";

export type SqIconsKey =
  | "Activities"
  | "Admission"
  | "Calendar"
  | "Checkmark"
  | "ChevronDown"
  | "ChevronLeft"
  | "ChevronRight"
  | "ChevronUp"
  | "Cross"
  | "Expand"
  | "Export"
  | "Import"
  | "Minimize"
  | "Pencil"
  | "Plus"
  | "Quit"
  | "Search"
  | "Send"
  | "Settings"
  | "Transfers"
  | "Trash";

export enum SqIcons {
  Activities = "activities",
  Admission = "admission",
  Calendar = "calendar",
  Checkmark = "checkmark",
  ChevronDown = "chevron-down",
  ChevronLeft = "chevron-left",
  ChevronRight = "chevron-right",
  ChevronUp = "chevron-up",
  Cross = "cross",
  Expand = "expand",
  Export = "export",
  Import = "import",
  Minimize = "minimize",
  Pencil = "pencil",
  Plus = "plus",
  Quit = "quit",
  Search = "search",
  Send = "send",
  Settings = "settings",
  Transfers = "transfers",
  Trash = "trash",
}

export const SQ_ICONS_CODEPOINTS: { [key in SqIcons]: string } = {
  [SqIcons.Activities]: "61697",
  [SqIcons.Admission]: "61698",
  [SqIcons.Calendar]: "61699",
  [SqIcons.Checkmark]: "61700",
  [SqIcons.ChevronDown]: "61701",
  [SqIcons.ChevronLeft]: "61702",
  [SqIcons.ChevronRight]: "61703",
  [SqIcons.ChevronUp]: "61704",
  [SqIcons.Cross]: "61705",
  [SqIcons.Expand]: "61706",
  [SqIcons.Export]: "61707",
  [SqIcons.Import]: "61708",
  [SqIcons.Minimize]: "61709",
  [SqIcons.Pencil]: "61710",
  [SqIcons.Plus]: "61711",
  [SqIcons.Quit]: "61712",
  [SqIcons.Search]: "61713",
  [SqIcons.Send]: "61714",
  [SqIcons.Settings]: "61715",
  [SqIcons.Transfers]: "61716",
  [SqIcons.Trash]: "61717",
};
