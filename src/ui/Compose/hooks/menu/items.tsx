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

export const Proofread = createMenuItem(SpellCheckIcon, 'Proofread')
export const Rephrase = createMenuItem(EditNoteIcon, 'Rephrase')
export const Translate = createMenuItem(TranslateIcon, 'Translate')
export const Expand = createMenuItem(DocsAddOnIcon, 'Expand')
export const Summarize = createMenuItem(SummarizeIcon, 'Summarize')
export const Simplify = createMenuItem(SegmentIcon, 'Simplify')
export const Compose = createMenuItem(StylusNoteIcon, 'Compose')
export const Settings = createMenuItem(TuneIcon, 'Settings')
