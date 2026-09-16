"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPasswordResetCode = exports.requestPasswordResetCode = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const admin = __importStar(require("firebase-admin"));
const crypto_1 = __importDefault(require("crypto"));
if (!admin.apps.length)
    admin.initializeApp();
function nowMs() {
    return Date.now();
}
function genCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}
function normalizeEmail(v) {
    return String(v ?? "").trim().toLowerCase();
}
function sha256(v) {
    return crypto_1.default.createHash("sha256").update(v).digest("hex");
}
function passwordResetDocId(email) {
    return sha256(`pwreset:${normalizeEmail(email)}`);
}
async function findUserByEmailSafe(email) {
    try {
        return await admin.auth().getUserByEmail(email);
    }
    catch {
        return null;
    }
}
exports.requestPasswordResetCode = (0, https_1.onCall)({
    region: "europe-west1",
    cors: true,
}, async (request) => {
    const email = normalizeEmail(request.data?.email);
    if (!email || !email.includes("@")) {
        throw new https_1.HttpsError("invalid-argument", "Geçerli bir e-posta gir.");
    }
    const user = await findUserByEmailSafe(email);
    // Kullanıcı var mı yok mu dışarı sızdırmıyoruz
    const ref = admin
        .firestore()
        .doc(`password_resets/${passwordResetDocId(email)}`);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() || {} : {};
    const lastSentAt = Number(data.lastSentAt || 0);
    if (lastSentAt && nowMs() - lastSentAt < 45000) {
        throw new https_1.HttpsError("resource-exhausted", "Çok hızlı tekrar denendi. 45 saniye bekle.");
    }
    // Kullanıcı yoksa yine başarılı gibi dön
    if (!user) {
        firebase_functions_1.logger.info("password reset requested for non-existing email", { email });
        return { ok: true };
    }
    const code = genCode();
    const codeHash = sha256(code);
    const expiresAt = nowMs() + 10 * 60 * 1000; // 10 dk
    await ref.set({
        uid: user.uid,
        email,
        codeHash,
        expiresAt,
        lastSentAt: nowMs(),
        attempts: 0,
        used: false,
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    await admin.firestore().collection("mail").add({
        to: email,
        from: "6nci Kuyumculuk <no-reply@6nci.com>",
        message: {
            subject: "6nci Kuyumculuk Şifre Sıfırlama Kodunuz",
            html: `
<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;background:#f8f5ef;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #eee4d2;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
    
    <div style="background:linear-gradient(180deg,#fffdf9 0%,#fff8ef 100%);padding:28px 24px 20px;text-align:center;border-bottom:1px solid #f1e8da;">
      <div style="display:inline-block;padding:8px 16px;border-radius:999px;background:#f5ead7;color:#b98c3c;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
        6nci Kuyumculuk
      </div>
      <h2 style="margin:16px 0 8px;font-size:28px;line-height:1.2;color:#1d2433;font-weight:800;">
        Şifre Sıfırlama Kodu
      </h2>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#6b7280;">
        Şifrenizi yenilemek için aşağıdaki tek kullanımlık kodu girin.
      </p>
    </div>

    <div style="padding:28px 24px 18px;">
      <p style="margin:0 0 16px;font-size:16px;color:#374151;">
        Merhaba,
      </p>

      <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#4b5563;">
        6nci Kuyumculuk hesabınız için şifre sıfırlama işlemi başlatıldı.
        Aşağıdaki kodu ilgili alana girerek yeni şifrenizi belirleyebilirsiniz:
      </p>

      <div style="text-align:center;margin:0 0 26px;">
        <div style="display:inline-block;min-width:220px;padding:18px 24px;border-radius:16px;background:#fff8ef;border:1px solid #ead7b5;">
          <div style="font-size:12px;line-height:1;margin-bottom:10px;color:#b98c3c;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
            Şifre Sıfırlama Kodu
          </div>
          <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#111827;">
            ${code}
          </div>
        </div>
      </div>

      <div style="margin:0 0 22px;padding:16px 18px;background:#fcfaf6;border:1px solid #efe6d8;border-radius:14px;">
        <p style="margin:0;font-size:14px;line-height:1.8;color:#6b7280;">
          Bu kod 10 dakika geçerlidir. Güvenliğiniz için bu kodu kimseyle paylaşmayın.
        </p>
      </div>

      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#6b7280;">
        Eğer bu işlemi siz başlatmadıysanız bu e-postayı dikkate almayabilirsiniz.
      </p>
    </div>

    <div style="padding:18px 24px 24px;text-align:center;border-top:1px solid #f1e8da;background:#fffdfa;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1f2937;">
        6nci Kuyumculuk
      </p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
        Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
      </p>
    </div>

  </div>
</div>
`,
        },
    });
    firebase_functions_1.logger.info("password reset code sent", { email, uid: user.uid });
    return { ok: true };
});
exports.confirmPasswordResetCode = (0, https_1.onCall)({
    region: "europe-west1",
    cors: true,
}, async (request) => {
    const email = normalizeEmail(request.data?.email);
    const code = String(request.data?.code || "").replace(/\D/g, "");
    const newPassword = String(request.data?.newPassword || "");
    if (!email || !email.includes("@")) {
        throw new https_1.HttpsError("invalid-argument", "Geçerli bir e-posta gir.");
    }
    if (!/^\d{6}$/.test(code)) {
        throw new https_1.HttpsError("invalid-argument", "Kod 6 haneli olmalı.");
    }
    if (newPassword.trim().length < 6) {
        throw new https_1.HttpsError("invalid-argument", "Yeni şifre en az 6 karakter olmalı.");
    }
    const ref = admin
        .firestore()
        .doc(`password_resets/${passwordResetDocId(email)}`);
    const snap = await ref.get();
    if (!snap.exists) {
        throw new https_1.HttpsError("not-found", "Kod bulunamadı. Önce yeni kod iste.");
    }
    const data = snap.data() || {};
    const expiresAt = Number(data.expiresAt || 0);
    const attempts = Number(data.attempts || 0);
    const used = data.used === true;
    const storedHash = String(data.codeHash || "");
    const incomingHash = sha256(code);
    if (used) {
        throw new https_1.HttpsError("permission-denied", "Bu kod zaten kullanılmış. Yeni kod iste.");
    }
    if (!expiresAt || nowMs() > expiresAt) {
        throw new https_1.HttpsError("deadline-exceeded", "Kod süresi dolmuş. Yeni kod iste.");
    }
    if (attempts >= 7) {
        throw new https_1.HttpsError("permission-denied", "Çok fazla deneme yapıldı. Yeni kod iste.");
    }
    if (!storedHash || incomingHash !== storedHash) {
        await ref.set({
            attempts: attempts + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        throw new https_1.HttpsError("permission-denied", "Kod yanlış.");
    }
    const uid = String(data.uid || "");
    if (!uid) {
        throw new https_1.HttpsError("failed-precondition", "Kullanıcı bilgisi eksik.");
    }
    await admin.auth().updateUser(uid, {
        password: newPassword,
    });
    await ref.set({
        used: true,
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
        codeHash: admin.firestore.FieldValue.delete(),
        expiresAt: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    firebase_functions_1.logger.info("password reset success", { email, uid });
    return { ok: true };
});
