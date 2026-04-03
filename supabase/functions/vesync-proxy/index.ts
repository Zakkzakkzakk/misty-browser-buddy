import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VESYNC_API = "https://smartapi.vesync.com";

async function md5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return encodeHex(new Uint8Array(hashBuffer));
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

      const res = await fetch(`${VESYNC_API}/cloud/v1/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: email,
          password: hashedPassword,
          devToken: "",
          userType: 1,
          method: "loginByEmail",
          token: "",
          traceId: Date.now().toString(),
          timeZone: "America/New_York",
          acceptLanguage: "en",
          appVersion: "2.8.6",
          phoneBrand: "SM-N975U1",
          phoneOS: "Android",
          clientInfo: "Chrome",
          clientType: "1",
          clientVersion: "",
        }),
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "getDevices") {
      const { token, accountId } = params;

      const res = await fetch(`${VESYNC_API}/cloud/v2/deviceManaged/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          accountID: accountId,
          timeZone: "America/New_York",
          acceptLanguage: "en",
          appVersion: "2.8.6",
          phoneBrand: "SM-N975U1",
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
          appVersion: "2.8.6",
          phoneBrand: "SM-N975U1",
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
          appVersion: "2.8.6",
          phoneBrand: "SM-N975U1",
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
