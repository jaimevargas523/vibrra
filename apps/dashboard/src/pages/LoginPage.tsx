import { useState, useEffect, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginPage() {
  const { t } = useTranslation("common");
  const { user, token, loading, error, login, injectToken, clearError } =
    useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* Handle token from landing page (hash fragment) */
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#token=")) {
      const externalToken = decodeURIComponent(hash.slice(7));
      if (externalToken) {
        injectToken(externalToken);
        window.location.hash = "";
        navigate("/anfitrion", { replace: true });
      }
    }
  }, [injectToken, navigate]);

  if ((user || token) && !loading) {
    return <Navigate to="/anfitrion" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || submitting) return;

    clearError();
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      // error is set in store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <img
            src="/vibrra-logo.svg"
            alt="VIBRRA"
            className="h-16 w-auto mb-3"
          />
          <p className="text-sm text-text-secondary">
            {t("login.welcome")}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface p-8">
          <h2 className="mb-6 text-center text-xl font-semibold text-text-primary">
            {t("login.title")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-secondary"
              >
                {t("login.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
                placeholder="correo@ejemplo.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-secondary"
              >
                {t("login.password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-border bg-bg px-4 py-3 pr-12 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {t("login.error")}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-sm font-semibold text-bg transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("states.cargando")}
                </>
              ) : (
                t("login.submit")
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-text-muted">
          VIBRRA &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
