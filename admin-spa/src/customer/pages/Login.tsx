import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { customerAuthApi } from "../../api/customerAuth";
import { useCustomerAuthStore } from "../store/auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function CustomerLogin() {
  const nav = useNavigate();
  const user = useCustomerAuthStore((s) => s.user);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleGoogleCredential = useCallback(async (idToken?: string) => {
    if (!idToken) {
      setErr("Google khong tra ve ID token.");
      return;
    }

    setErr(null);
    setLoading(true);

    try {
      await customerAuthApi.google(idToken);
      nav("/", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data ?? e?.message ?? "Dang nhap Google that bai.");
    } finally {
      setLoading(false);
    }
  }, [nav]);

  useEffect(() => {
    if (user) nav("/", { replace: true });
  }, [nav, user]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const scriptId = "google-identity-services";
    const render = () => {
      if (!window.google || !googleButtonRef.current) return;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => void handleGoogleCredential(response.credential),
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: "popup",
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "signin_with",
        locale: "vi",
        width: 320,
      });
    };

    const existing = document.getElementById(scriptId);
    if (existing) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [handleGoogleCredential]);

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 text-stone-900">
      <div className="mx-auto max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900">
          <ArrowLeft size={16} />
          Ve trang chu
        </Link>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-amber-700 text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Dang nhap khach hang</h1>
              <p className="mt-1 text-sm text-stone-500">Dang nhap bang tai khoan Google.</p>
            </div>
          </div>

          {err && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{String(err)}</div>}

          <div className="mt-6">
            {googleClientId ? (
              <>
                <div className="flex justify-center" ref={googleButtonRef} />
                {loading && <p className="mt-3 text-center text-sm text-stone-500">Dang xac thuc voi Google...</p>}
              </>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Chua cau hinh VITE_GOOGLE_CLIENT_ID.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
