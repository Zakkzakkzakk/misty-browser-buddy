import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VESYNC_API = "https://smartapi.vesync.com";

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function md5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return toHex(hashBuffer);
}

function randomAppId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomTerminalId(): string {
  return "2" + crypto.randomUUID().replace(/-/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    if (action === "login") {
      const { email, password } = params;
      const hashedPassword = await md5(password);
      const appId = randomAppId();
      const terminalId = randomTerminalId();

      // Step 1: Auth - get authorizeCode
      const authRes = await fetch(
        `${VESYNC_API}/globalPlatform/api/accountAuth/v1/authByPWDOrOTM`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: hashedPassword,
            method: "authByPWDOrOTM",
            authProtocolType: "generic",
            acceptLanguage: "en",
            accountID: "",
            clientInfo: "SM N9005",
            clientType: "vesyncApp",
            clientVersion: "VeSync 5.6.60",
            debugMode: false,
            osInfo: "Android",
            terminalId,
            timeZone: "America/New_York",
            token: "",
            userCountryCode: "US",
            appID: appId,
            sourceAppID: appId,
            traceId: Date.now().toString(),
            devToken: "",
            userType: "1",
          }),
        }
      );

      const authData = await authRes.json();

      if (authData?.code !== 0 || !authData?.result?.authorizeCode) {
        return new Response(JSON.stringify(authData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const authorizeCode = authData.result.authorizeCode;

      // Step 2: Login - exchange authorizeCode for token
      const loginRes = await fetch(
        `${VESYNC_API}/user/api/accountManage/v1/loginByAuthorizeCode4Vesync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "loginByAuthorizeCode4Vesync",
            authorizeCode,
            acceptLanguage: "en",
            accountID: "",
            clientInfo: "SM N9005",
            clientType: "vesyncApp",
            clientVersion: "VeSync 5.6.60",
            debugMode: false,
            emailSubscriptions: false,
            osInfo: "Android",
            terminalId,
            timeZone: "America/New_York",
            token: "",
            userCountryCode: "US",
            traceId: Date.now().toString(),
          }),
        }
      );

      const loginData = await loginRes.json();
      return new Response(JSON.stringify(loginData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "getDevices") {
      const { token, accountId } = params;

      const res = await fetch(`${VESYNC_API}/cloud/v1/deviceManaged/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          accountID: accountId,
          timeZone: "America/New_York",
          acceptLanguage: "en",
          appVersion: "5.6.60",
          phoneBrand: "SM N9005",
          phoneOS: "Android",
          method: "devices",
          pageNo: 1,
          pageSize: 100,
          traceId: Date.now().toString(),
        }),
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "deviceControl") {
      const { token, accountId, cid, uuid, configModule, payload } = params;

      const res = await fetch(`${VESYNC_API}/cloud/v2/deviceManaged/bypassV2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          accountID: accountId,
          timeZone: "America/New_York",
          acceptLanguage: "en",
          appVersion: "5.6.60",
          phoneBrand: "SM N9005",
          phoneOS: "Android",
          method: "bypassV2",
          debugMode: false,
          deviceRegion: "US",
          traceId: Date.now().toString(),
          cid,
          configModule,
          payload,
        }),
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "deviceStatus") {
      const { token, accountId, cid, uuid, configModule } = params;

      const res = await fetch(`${VESYNC_API}/cloud/v2/deviceManaged/bypassV2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          accountID: accountId,
          timeZone: "America/New_York",
          acceptLanguage: "en",
          appVersion: "5.6.60",
          phoneBrand: "SM N9005",
          phoneOS: "Android",
          method: "bypassV2",
          debugMode: false,
          deviceRegion: "US",
          traceId: Date.now().toString(),
          cid,
          configModule,
          payload: {
            data: {},
            method: "getHumidifierStatus",
            source: "APP",
          },
        }),
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
