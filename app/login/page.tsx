import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LoginButtons } from "@/components/auth/LoginButtons";

export const metadata = { title: "Вход — SANA" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold tracking-tight">
          <Sparkles className="h-6 w-6 text-[var(--data)]" />
          SANA
        </Link>
        <h1 className="mb-1 text-center text-2xl font-semibold text-foreground">Демо-доступ в один клик</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Выберите роль — увидите, как один вопрос даёт разные данные в зависимости от прав.
        </p>
        <LoginButtons />
      </div>
    </div>
  );
}
