import {
  DocsAddOnIcon,
  EditNoteIcon,
  SegmentIcon,
  SpellCheckIcon,
  StylusNoteIcon,
  SummarizeIcon,
  TranslateIcon,
  TuneIcon,
} from '../../../Icons/Icons.js'
import { createMenuItem } from './Item.js'

export const Proofread = createMenuItem(SpellCheckIcon)
export const Rephrase = createMenuItem(EditNoteIcon)
export const Translate = createMenuItem(TranslateIcon)
export const Expand = createMenuItem(DocsAddOnIcon)
export const Summarize = createMenuItem(SummarizeIcon)
export const Simplify = createMenuItem(SegmentIcon)
export const Compose = createMenuItem(StylusNoteIcon)
export const Settings = createMenuItem(TuneIcon)
