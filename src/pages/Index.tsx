import { useState, useEffect } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";
import { vesyncLogin, type VeSyncSession } from "@/lib/vesync";

const SESSION_KEY = "vesync_session";

const Index = () => {
  const [session, setSession] = useState<VeSyncSession | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const s = await vesyncLogin(email, password);
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  if (!session) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <Dashboard session={session} onLogout={handleLogout} />;
};

export default Index;
