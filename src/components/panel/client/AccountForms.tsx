"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { changePassword, updateProfile } from "@/app/panel/actions";
import { logout } from "@/app/konto/actions";
import { Btn, Card, CardHead, field, ICONS, Label } from "../kit";
import PhoneInput from "../PhoneInput";

function Msg({ r }: { r?: { ok?: string; error?: string } }) {
  return (
    <AnimatePresence>
      {r && (r.ok || r.error) && (
        <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`text-[13.5px] ${r.error ? "text-red-300" : "text-emerald-200"}`}>
          {r.error ?? r.ok}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export default function AccountForms({ name, phone, email, since }: { name: string; phone: string; email: string; since: number }) {
  const router = useRouter();
  const [p, setP] = useState({ name, phone });
  const [phoneOk, setPhoneOk] = useState(true);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [r1, setR1] = useState<{ ok?: string; error?: string }>();
  const [r2, setR2] = useState<{ ok?: string; error?: string }>();
  const [busy1, s1] = useTransition();
  const [busy2, s2] = useTransition();
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
      <Card>
        <CardHead title="Dane" />
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!phoneOk) return setR1({ error: "Popraw numer telefonu." });
            s1(async () => {
              const r = await updateProfile(p);
              setR1(r);
              if (r.ok) router.refresh();
            });
          }}
        >
          <Label label="Imię i nazwisko">
            <input className={`${field} h-11`} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
          </Label>
          <div>
            <span className="mb-1.5 block text-[13px] text-muted">Telefon</span>
            <PhoneInput value={phone} onChange={(v, valid) => (setP((x) => ({ ...x, phone: v })), setPhoneOk(valid || !v))} />
          </div>
          <Label label="E-mail">
            <input className={`${field} h-11 opacity-60`} value={email} disabled />
          </Label>
          <div className="flex items-center justify-between gap-3 pt-1">
            <Msg r={r1} />
            <Btn type="submit" variant="primary" icon={ICONS.check} disabled={busy1} className="ml-auto">
              Zapisz
            </Btn>
          </div>
        </form>
      </Card>

      <div className="grid content-start gap-4 lg:gap-5">
        <Card delay={0.05}>
          <CardHead title="Hasło" />
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              s2(async () => {
                const r = await changePassword(pw);
                setR2(r);
                if (r.ok) setPw({ current: "", next: "" });
              });
            }}
          >
            <Label label="Obecne hasło">
              <input type="password" autoComplete="current-password" className={`${field} h-11`} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </Label>
            <Label label="Nowe hasło">
              <input type="password" autoComplete="new-password" className={`${field} h-11`} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="min. 8 znaków" />
            </Label>
            <div className="flex items-center justify-between gap-3 pt-1">
              <Msg r={r2} />
              <Btn type="submit" variant="primary" icon={ICONS.key} disabled={busy2 || !pw.current || !pw.next} className="ml-auto">
                Zmień hasło
              </Btn>
            </div>
          </form>
        </Card>
        <Card delay={0.1}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[15px]">Klient od</p>
              <p className="text-[13px] text-dim">{new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" }).format(since)}</p>
            </div>
            <form action={logout}>
              <Btn type="submit" variant="outline" icon={ICONS.logout}>
                Wyloguj
              </Btn>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
