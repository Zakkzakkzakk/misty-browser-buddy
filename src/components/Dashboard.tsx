import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Droplets, LogOut, RefreshCw, Loader2 } from "lucide-react";
import { HumidifierCard } from "@/components/HumidifierCard";
import type { VeSyncSession } from "@/lib/vesync";
import { vesyncGetDevices } from "@/lib/vesync";

interface DashboardProps {
  session: VeSyncSession;
  onLogout: () => void;
}

export function Dashboard({ session, onLogout }: DashboardProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const list = await vesyncGetDevices(session);
      setDevices(list);
    } catch (e) {
      console.error("Failed to get devices", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const humidifiers = devices.filter(
    (d: any) => d.deviceType?.toLowerCase().includes("humidifier") ||
                d.type?.toLowerCase().includes("humidifier") ||
                d.deviceType?.includes("LUH") ||
                d.deviceType?.includes("LEH") ||
                d.deviceType?.includes("Classic") ||
                d.deviceType?.includes("Dual") ||
                d.deviceType?.includes("Oasis")
  );

  const otherDevices = devices.filter(
    (d: any) => !humidifiers.includes(d)
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center glow-ring">
              <Droplets className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">VeSync Control</h1>
              <p className="text-xs text-muted-foreground font-mono">Humidifier Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchDevices} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-3">
            <Droplets className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">No devices found</h2>
            <p className="text-muted-foreground text-sm">
              Make sure your devices are registered in the VeSync app.
            </p>
          </div>
        ) : (
          <>
            {humidifiers.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Humidifiers ({humidifiers.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {humidifiers.map((d: any) => (
                    <HumidifierCard key={d.cid} device={d} session={session} />
                  ))}
                </div>
              </div>
            )}

            {otherDevices.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Other Devices ({otherDevices.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherDevices.map((d: any) => (
                    <div key={d.cid} className="glass-card p-4">
                      <h3 className="font-medium text-foreground">{d.deviceName}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{d.deviceType}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${
                          d.connectionStatus === "online" ? "bg-primary" : "bg-destructive"
                        }`} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {d.connectionStatus} · {d.deviceStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {humidifiers.length === 0 && (
              <div className="glass-card p-8 text-center space-y-2">
                <p className="text-muted-foreground">
                  No humidifiers found. {devices.length} other device(s) detected.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
