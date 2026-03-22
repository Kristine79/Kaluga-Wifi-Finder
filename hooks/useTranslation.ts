import { useWifi } from "@/context/WifiContext";
import translations from "@/lib/i18n";
import type { Translations } from "@/lib/i18n";

export function useTranslation(): Translations {
  const { settings } = useWifi();
  return translations[settings.language ?? "ru"];
}
