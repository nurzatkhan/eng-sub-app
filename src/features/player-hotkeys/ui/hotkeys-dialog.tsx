"use client";

import { Fragment } from "react";
import { KeyboardIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Kbd, KbdGroup } from "@/shared/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { HOTKEYS, type Hotkey } from "../config/hotkeys";
import { useHotkeysHelpStore } from "../model/help-store";

const GROUPS: Hotkey["group"][] = ["Видео", "Учёба", "Другое"];

export function HotkeysButton() {
  const toggle = useHotkeysHelpStore((s) => s.toggle);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Горячие клавиши" onClick={toggle}>
          <KeyboardIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Горячие клавиши <Kbd>?</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

export function HotkeysDialog() {
  const open = useHotkeysHelpStore((s) => s.open);
  const setOpen = useHotkeysHelpStore((s) => s.setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Горячие клавиши</DialogTitle>
          <DialogDescription>Работают в любой раскладке. Чтобы открыть это окно, нажмите ?</DialogDescription>
        </DialogHeader>
        {GROUPS.map((group) => (
          <section key={group} className="flex flex-col gap-1">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{group}</h3>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
              {HOTKEYS.filter((h) => h.group === group).map((h) => (
                <Fragment key={h.id}>
                  <dt>{h.description}</dt>
                  <dd className="flex items-center justify-end gap-1.5">
                    {h.combos.map((c, i) => (
                      <Fragment key={i}>
                        {i > 0 && <span className="text-xs text-muted-foreground">или</span>}
                        <KbdGroup>
                          {c.label.map((k) => (
                            <Kbd key={k}>{k}</Kbd>
                          ))}
                        </KbdGroup>
                      </Fragment>
                    ))}
                  </dd>
                </Fragment>
              ))}
            </dl>
          </section>
        ))}
      </DialogContent>
    </Dialog>
  );
}
