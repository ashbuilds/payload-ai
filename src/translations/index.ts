import type { NestedKeysStripped } from '@payloadcms/translations'

// import de from './de.json' with { type: 'json' }
import en from './en.json' with { type: 'json' }
import es from './es.json' with { type: 'json' }
// import fa from './fa.json' with { type: 'json' }
// import fr from './fr.json' with { type: 'json' }
// import hi from './hi.json' with { type: 'json' }
// import ja from './ja.json' with { type: 'json' }
// import nb from './nb.json' with { type: 'json' }
// import nl from './nl.json' with { type: 'json' }
// import pl from './pl.json' with { type: 'json' }
// import pt from './pt.json' with { type: 'json' }
// import ru from './ru.json' with { type: 'json' }
// import th from './th.json' with { type: 'json' }
// import uk from './uk.json' with { type: 'json' }
// import zh from './zh.json' with { type: 'json' }

export const translations = {
  // de,
  en,
  es,
  // fa,
  // fr,
  // hi,
  // ja,
  // nb,
  // nl,
  // pl,
  // pt,
  // ru,
  // th,
  // uk,
  // zh,
}

export type PluginAITranslations = typeof translations.en

export type PluginAITranslationKeys = NestedKeysStripped<PluginAITranslations>
