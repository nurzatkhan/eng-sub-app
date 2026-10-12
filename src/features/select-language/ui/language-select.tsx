"use client";

import { LanguagesIcon } from "lucide-react";
import { useLanguageStore } from "@/entities/translation";
import { TARGET_LANGUAGES, isTargetLanguage } from "@/shared/config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

export function LanguageSelect() {
  const target = useLanguageStore((s) => s.target);
  const setTarget = useLanguageStore((s) => s.setTarget);

  return (
    <Select value={target} onValueChange={(v) => isTargetLanguage(v) && setTarget(v)}>
      <SelectTrigger aria-label="Язык перевода" className="w-40">
        <LanguagesIcon />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TARGET_LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
