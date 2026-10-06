"use client";

import VerifyStep from "./VerifyStep";

export default function VerifyForm({ email, sendFailed }: { email: string; sendFailed: boolean }) {
  return <VerifyStep email={email} initialError={sendFailed ? "Nie udało się wysłać maila. Wyślij kod ponownie." : undefined} />;
}
