// Загрузка .env для standalone-скриптов (seed, db-deploy, prod-verify).
// Next сам грузит .env для приложения; скриптам нужно вручную.
// Node 20.6+/24: process.loadEnvFile. Грузим .env, затем .env.local (перекрывает).
export function loadEnv() {
  for (const file of [".env", ".env.local"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // файла нет — не критично (на проде переменные уже в окружении)
    }
  }
}
