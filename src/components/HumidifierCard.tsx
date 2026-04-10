import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Droplets,
  Power,
  RefreshCw,
  Loader2,
  Wind,
  Moon,
  Gauge,
} from "lucide-react";
import type { VeSyncSession } from "@/lib/vesync";
import {
  vesyncGetStatus,
  vesyncTurnOn,
  vesyncTurnOff,
  vesyncSetMistLevel,
  vesyncSetMode,
  vesyncSetTargetHumidity,
} from "@/lib/vesync";

interface Device {
  cid: string;
  uuid: string;
  configModule: string;
  deviceName: string;
  deviceType: string;
  deviceStatus: string;
  connectionStatus: string;
}

interface HumidifierCardProps {
  device: Device;
  session: VeSyncSession;
}

export function HumidifierCard({ device, session }: HumidifierCardProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const s = await vesyncGetStatus(session, device);
      setStatus(s);
    } catch (e) {
      console.error("Failed to get status", e);
    } finally {
      setLoading(false);
    }
  }, [session, device]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isOn = status?.enabled || status?.device_status === "on" || device.deviceStatus === "on";
  const humidity = status?.humidity ?? "--";
  const serverMistLevel = status?.mist_virtual_level ?? status?.mist_level ?? 1;
  const mode = status?.mode ?? "manual";
  const serverTargetHumidity = status?.configuration?.auto_target_humidity ?? status?.target_humidity ?? 50;

  const [localMistLevel, setLocalMistLevel] = useState<number>(serverMistLevel);
  const [localTargetHumidity, setLocalTargetHumidity] = useState<number>(serverTargetHumidity);

  useEffect(() => { setLocalMistLevel(serverMistLevel); }, [serverMistLevel]);
  useEffect(() => { setLocalTargetHumidity(serverTargetHumidity); }, [serverTargetHumidity]);

  const handleToggle = async () => {
    setActionLoading(true);
    try {
      if (isOn) {
        await vesyncTurnOff(session, device);
      } else {
        await vesyncTurnOn(session, device);
      }
      setTimeout(fetchStatus, 1000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMistChange = async (value: number[]) => {
    setActionLoading(true);
    try {
      await vesyncSetMistLevel(session, device, value[0]);
      setTimeout(fetchStatus, 1000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleModeChange = async (newMode: string) => {
    setActionLoading(true);
    try {
      await vesyncSetMode(session, device, newMode);
      setTimeout(fetchStatus, 1000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTargetHumidity = async (value: number[]) => {
    setActionLoading(true);
    try {
      await vesyncSetTargetHumidity(session, device, value[0]);
      setTimeout(fetchStatus, 1000);
    } finally {
      setActionLoading(false);
    }
  };

  const modes = [
    { id: "manual", label: "Manual", icon: Gauge },
    { id: "auto", label: "Auto", icon: Wind },
    { id: "sleep", label: "Sleep", icon: Moon },
  ];

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
            isOn ? "bg-primary/20 glow-ring" : "bg-muted"
          }`}>
            <Droplets className={`w-5 h-5 transition-colors ${isOn ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{device.deviceName}</h3>
            <p className="text-xs text-muted-foreground font-mono">{device.deviceType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchStatus} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            size="icon"
            onClick={handleToggle}
            disabled={actionLoading}
            className={`transition-all duration-300 ${
              isOn
                ? "bg-primary hover:bg-primary/80"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Humidity Display */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-full border-4 border-border flex items-center justify-center">
              <div
                className="absolute inset-1 rounded-full"
                style={{
                  background: `conic-gradient(hsl(var(--primary)) ${Number(humidity) * 3.6}deg, transparent 0deg)`,
                  opacity: 0.15,
                }}
              />
              <div className="text-center z-10">
                <span className="text-3xl font-bold text-foreground font-mono">{humidity}</span>
                <span className="text-lg text-muted-foreground">%</span>
                <p className="text-xs text-muted-foreground">Humidity</p>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {modes.map((m) => (
                <Button
                  key={m.id}
                  variant="ghost"
                  onClick={() => handleModeChange(m.id)}
                  disabled={actionLoading}
                  className={`flex flex-col gap-1 h-auto py-3 transition-all ${
                    mode === m.id
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  <span className="text-xs">{m.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Mist Level */}
          {mode === "manual" && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Mist Level</p>
                <span className="text-sm font-mono text-primary">{localMistLevel}</span>
              </div>
              <Slider
                value={[localMistLevel]}
                min={1}
                max={9}
                step={1}
                onValueChange={(v) => setLocalMistLevel(v[0])}
                onValueCommit={handleMistChange}
                disabled={actionLoading || !isOn}
                className="w-full"
              />
            </div>
          )}

          {/* Target Humidity (Auto mode) */}
          {mode === "auto" && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Target Humidity</p>
                <span className="text-sm font-mono text-primary">{targetHumidity}%</span>
              </div>
              <Slider
                value={[targetHumidity]}
                min={30}
                max={80}
                step={5}
                onValueCommit={handleTargetHumidity}
                disabled={actionLoading || !isOn}
                className="w-full"
              />
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <div className={`w-2 h-2 rounded-full ${
              device.connectionStatus === "online" ? "bg-primary animate-pulse" : "bg-destructive"
            }`} />
            <span className="text-xs text-muted-foreground capitalize">
              {device.connectionStatus}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
