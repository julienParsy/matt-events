// /app/routes/debugRoutes.js
const router = require("express").Router();
const net = require("net");
const { verifySMTP, sendMail } = require("../services/emailService");

function testPort(host, port, timeout = 5000) {
    return new Promise((resolve) => {
        const socket = net.createConnection({ host, port, family: 4 }); // IPv4
        let done = false;
        const finish = (ok, err) => { if (done) return; done = true; socket.destroy(); resolve({ host, port, ok, err: err && String(err.message || err) }); };
        socket.setTimeout(timeout);
        socket.on("connect", () => finish(true));
        socket.on("timeout", () => finish(false, new Error("timeout")));
        socket.on("error", (e) => finish(false, e));
    });
}

router.get("/smtp", async (_req, res) => {
    const hosts = [process.env.SMTP_HOST || "smtp.mail.ovh.net", "ssl0.ovh.net"];
    const ports = [465, 587];
    const checks = [];
    for (const h of hosts) for (const p of ports) checks.push(await testPort(h, p));
    res.json({ checks });
});

router.get("/mail", async (_req, res) => {
    try {
        const via = await verifySMTP();
        await sendMail({ subject: "Test SMTP Matt'events", text: "OK depuis le backend." });
        res.json({ ok: true, via });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
});

module.exports = router;
