const http2 = require("http2");
const tls = require("tls");
const WebSocket = require("ultimate-ws");
const https = require("https");
const os = require("os");
let m = null;
const ct = '';
const lt = '';
const cp = '';
const gi = '';
const wh = '';
const ho = ["canary.discord.com"];

const va = new Map();
const ca = new Map();
const so = [];

const ka = Buffer.from("GET / HTTP/1.1\r\nHost: canary.discord.com\r\n\r\n");

const pr = [
    { initialWindowSize: 1073741824, maxConcurrentStreams: 100, maxHeaderListSize: 16384, maxFrameSize: 16777215, headerTableSize: 4096 },
    { initialWindowSize: 1073741824, maxConcurrentStreams: 5000, maxHeaderListSize: 8192, maxFrameSize: 32768, headerTableSize: 4096 },
    { initialWindowSize: 1073741824, maxConcurrentStreams: 5000, maxHeaderListSize: 3500, maxFrameSize: 32768, headerTableSize: 4096 }
];

function p(c) {
    setTimeout(() => {
        const b = JSON.stringify({ code: c });
        const r = Buffer.from(`PATCH /api/v9/guilds/${gi}/vanity-url HTTP/1.1\r\nHost: canary.discord.com\r\nAuthorization: ${ct}\r\nContent-Type: application/json\r\nUser-Agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36\r\nX-Discord-Mfa-Authorization: ${m}\r\nContent-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`);
        
        ca.set(c, {
            r,
            h: {
                ":method": "PATCH",
                ":path": `/api/v9/guilds/${gi}/vanity-url`,
                "Authorization": ct,
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
                "X-Discord-Mfa-Authorization": m || ""
            },
            b
        });
    }, Math.floor(Math.random() * 3) + 1);
}

function cn(h) {
    setTimeout(() => {
        const s = tls.connect({
            host: h,
            port: 443,
            servername: 'canary.discord.com',
            minVersion: 'TLSv1.2',
            maxVersion: 'TLSv1.3',
            rejectUnauthorized: false,
            noDelay: true
        });
        s.setNoDelay(true);
        s.setKeepAlive(true, 10000);
        s.once('error', () => setTimeout(() => cn(h), 1500));
        so.push(s);
    }, Math.floor(Math.random() * 2) + 1);
}

const se = pr.map((x, i) => {
    const s = http2.connect("https://canary.discord.com", {
        settings: { enablePush: false, ...x },
        createConnection: () => tls.connect({
            host: "canary.discord.com",
            port: 443,
            servername: "canary.discord.com",
            ALPNProtocols: ['h2'],
            rejectUnauthorized: false,
            noDelay: true
        })
    });
    s.on("connect", () => console.log(`[SESSION] Active: ${i}`));
    return s;
});

se[0].once("connect", () => {
    ho.forEach(h => cn(h));
    mf();
    setInterval(mf, 5 * 60 * 1000);
});

const hb = Buffer.from('{"op":1,"d":null}');
const id = Buffer.from(JSON.stringify({
    op: 2,
    d: { token: lt, intents: 1, properties: { os: "linux", browser: "Discord Client", device: "Desktop" } }
}));

function sn(v, d) {
    setTimeout(() => {
        for (let i = 0; i < so.length; i++) {
            if (!so[i].destroyed) so[i].write(d.r);
        }
    }, Math.floor(Math.random() * 2) + 1);

    setTimeout(() => {
        for (let i = 0; i < se.length; i++) {
            const st = se[i].request(d.h);
            st.on("response", () => {
                let rs = "";
                st.on("data", (c) => rs += c);
                st.on("end", () => {
                    setImmediate(() => {
                        const pl = JSON.stringify({
                            content: "@everyone",
                            embeds: [{
                                description: `・ **Vanity : discord.gg/${v}\n\nResponse:**\n\`\`\`json\n${rs}\n\`\`\``,
                                color: 0x000000,
                                footer: { text: "vanity claimed" }
                            }]
                        });
                        const rq = https.request(wh, { method: "POST", headers: { "Content-Type": "application/json" } });
                        rq.on("error", () => {});
                        rq.write(pl);
                        rq.end();
                    });
                });
            });
            st.end(d.b);
        }
    }, Math.floor(Math.random() * 2) + 1);
}

for (let g = 1; g <= 2; g++) {
    se[g].once("connect", () => {
        setTimeout(() => {
            const ws = new WebSocket(`wss://gateway-us-east1-b.discord.gg/?v=10&encoding=json`, {
                perMessageDeflate: false,
                rejectUnauthorized: false
            });

            let rd = false;

            ws.onopen = () => {
                ws.send(id);
                setInterval(() => { if (ws.readyState === 1) ws.send(hb); }, 41250);
            };

            ws.onmessage = ({ data }) => {
                setTimeout(() => {
                    const e = JSON.parse(data);
                    if (e.t === "GUILD_UPDATE" && rd) {
                        const o = va.get(e.d.id);
                        if (o && o !== e.d.vanity_url_code) {
                            const d = ca.get(o);
                            if (d) sn(o, d);
                        }
                    } else if (e.t === "READY") {
                        rd = true;
                        e.d.guilds.forEach(g => {
                            if (g.vanity_url_code) {
                                va.set(g.id, g.vanity_url_code);
                                p(g.vanity_url_code);
                            }
                        });
                        console.log(`[INIT] Tracking: (${va.size}) - ${[...va.values()].join(", ")}`);
                    }
                }, Math.floor(Math.random() * 2) + 1);
            };

            ws.onerror = () => ws.close();
        }, Math.floor(Math.random() * 3) + 1);
    });
}

async function mf() {
    try {
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 3) + 1));

        const tk = await new Promise((re, rj) => {
            const r = https.request({
                hostname: "canary.discord.com",
                port: 443,
                path: "/api/v10/guilds/0/vanity-url",
                method: "PATCH",
                headers: { Authorization: ct, "Content-Type": "application/json" },
                timeout: 1000,
                agent: new https.Agent({
                    ciphers: ["TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256", "TLS_AES_128_GCM_SHA256"].join(":"),
                    honorCipherOrder: true,
                    rejectUnauthorized: true
                })
            }, rs => {
                let b = '';
                rs.on("data", c => b += c);
                rs.on("end", () => {
                    try { re(JSON.parse(b || "{}")?.mfa?.ticket); } catch (e) { rj(e); }
                });
            });
            r.on("error", rj);
            r.end('{"code":""}');
        });

        if (!tk) { setTimeout(mf, 60000); return; }

        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 2) + 1));

        const rs = await new Promise((re, rj) => {
            const r = https.request({
                hostname: "canary.discord.com",
                port: 443,
                path: "/api/v10/mfa/finish",
                method: "POST",
                headers: {
                    Authorization: ct,
                    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
                    "Content-Type": "application/json",
                    "X-Super-Properties": "eyJvcyI6IkFuZHJvaWQiLCJicm93c2VyIjoiQW5kcm9pZCBDaHJvbWUiLCJkZXZpY2UiOiJBbmRyb2lkIiwic3lzdGVtX2xvY2FsZSI6InRyLVRSIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDYuMDsgTmV4dXMgNSBCdWlsZC9NUkE1OE4pIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMzEuMC4wLjAgTW9iaWxlIFNhZmFyaS81MzcuMzYiLCJicm93c2VyX3ZlcnNpb24iOiIxMzEuMC4wLjAiLCJvc192ZXJzaW9uIjoiNi4wIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2NoYW5uZWxzL0BtZS8xMzAzMDQ1MDIyNjQzNTIzNjU1IiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyaW5nX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjozNTU2MjQsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGwsImhhc19jbGllbnRfbW9kcyI6ZmFsc2V9"
                },
                timeout: 1000,
                agent: new https.Agent({
                    ciphers: ["TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256", "TLS_AES_128_GCM_SHA256"].join(":"),
                    honorCipherOrder: true,
                    rejectUnauthorized: true
                })
            }, rs => {
                let b = '';
                rs.on("data", c => b += c);
                rs.on("end", () => {
                    try { re(JSON.parse(b || "{}")); } catch (e) { rj(e); }
                });
            });
            r.on("error", rj);
            r.end(`{"ticket":"${tk}","mfa_type":"password","data":"${cp}"}`);
        });

        if (rs?.token) {
            m = rs.token;
            console.log("[AUTH] MFA validated");
            for (const c of va.values()) p(c);
        } else {
            console.log("[AUTH] MFA failed:", rs);
            setTimeout(mf, 60000);
        }
    } catch (e) {
        setTimeout(mf, 60000);
    }
}

setInterval(() => {
    so.forEach(s => { if (!s.destroyed) s.write(ka); });
}, 10000);

setTimeout(() => {
    console.log("[CYCLE] Restarting process...");
    process.exit(0);
}, 30601000);
