import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL || ""}/functions/v1/vesync-proxy`;

async function callProxy(body: Record<string, unknown>) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export interface VeSyncSession {
  token: string;
  accountId: string;
  region: string;
}

export async function vesyncLogin(email: string, password: string, region: string = "US"): Promise<VeSyncSession> {
  const data = await callProxy({ action: "login", email, password, region });
  if (data?.result?.token) {
    return { token: data.result.token, accountId: data.result.accountID, region };
  }
  throw new Error(data?.msg || "Login failed");
}

export async function vesyncGetDevices(session: VeSyncSession) {
  const data = await callProxy({
    action: "getDevices",
    token: session.token,
    accountId: session.accountId,
    region: session.region,
  });
  return data?.result?.list || [];
}

export async function vesyncGetStatus(session: VeSyncSession, device: { cid: string; uuid: string; configModule: string }) {
  const data = await callProxy({
    action: "deviceStatus",
    token: session.token,
    accountId: session.accountId,
    region: session.region,
    cid: device.cid,
    uuid: device.uuid,
    configModule: device.configModule,
  });
  return data?.result?.result || data?.result || {};
}

export async function vesyncControl(
  session: VeSyncSession,
  device: { cid: string; uuid: string; configModule: string },
  payload: Record<string, unknown>
) {
  const data = await callProxy({
    action: "deviceControl",
    token: session.token,
    accountId: session.accountId,
    region: session.region,
    cid: device.cid,
    uuid: device.uuid,
    configModule: device.configModule,
    payload,
  });
  return data;
}

export async function vesyncTurnOn(session: VeSyncSession, device: { cid: string; uuid: string; configModule: string }) {
  return vesyncControl(session, device, {
    data: { enabled: true, id: 0 },
    method: "setSwitch",
    source: "APP",
  });
}

export async function vesyncTurnOff(session: VeSyncSession, device: { cid: string; uuid: string; configModule: string }) {
  return vesyncControl(session, device, {
    data: { enabled: false, id: 0 },
    method: "setSwitch",
    source: "APP",
  });
}

export async function vesyncSetMistLevel(session: VeSyncSession, device: { cid: string; uuid: string; configModule: string }, level: number) {
  return vesyncControl(session, device, {
    data: { id: 0, level, type: "mist" },
    method: "setVirtualLevel",
    source: "APP",
  });
}

export async function vesyncSetMode(session: VeSyncSession, device: { cid: string; uuid: string; configModule: string }, mode: string) {
  return vesyncControl(session, device, {
    data: { mode },
    method: "setHumidityMode",
    source: "APP",
  });
}

export async function vesyncSetTargetHumidity(session: VeSyncSession, device: { cid: string; uuid: string; configModule: string }, humidity: number) {
  return vesyncControl(session, device, {
    data: { target_humidity: humidity },
    method: "setTargetHumidity",
    source: "APP",
  });
}
