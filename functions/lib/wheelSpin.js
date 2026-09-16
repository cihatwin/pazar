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
exports.spinWheelV1 = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const admin = __importStar(require("firebase-admin"));
const crypto_1 = __importDefault(require("crypto"));
if (!admin.apps.length)
    admin.initializeApp();
function sha256(v) {
    return crypto_1.default.createHash("sha256").update(v).digest("hex");
}
function normalizeIp(raw) {
    return String(raw || "").split(",")[0].trim();
}
function safeStr(v, fallback = "") {
    const x = String(v ?? "").trim();
    return x || fallback;
}
function safeNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}
function buildCouponCode(label, prefix = "WHEEL") {
    const clean = String(label || "")
        .toUpperCase()
        .replace(/%/g, "YUZDE")
        .replace(/\s+/g, "")
        .replace(/İ/g, "I")
        .replace(/Ş/g, "S")
        .replace(/Ğ/g, "G")
        .replace(/Ü/g, "U")
        .replace(/Ö/g, "O")
        .replace(/Ç/g, "C")
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8);
    const safePrefix = String(prefix || "WHEEL")
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/İ/g, "I")
        .replace(/Ş/g, "S")
        .replace(/Ğ/g, "G")
        .replace(/Ü/g, "U")
        .replace(/Ö/g, "O")
        .replace(/Ç/g, "C")
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10) || "WHEEL";
    const rand = crypto_1.default.randomBytes(5).toString("hex").toUpperCase();
    return `${safePrefix}-${clean}-${rand}`;
}
function normalizeEmail(v) {
    return safeStr(v).toLowerCase();
}
function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function normalizeDeviceId(v) {
    return safeStr(v).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
}
function pickWeightedWinner(rewards) {
    const pool = rewards.filter((x) => x?.isWinnable !== false && Number(x?.probabilityWeight || 0) > 0);
    if (!pool.length) {
        throw new https_1.HttpsError("failed-precondition", "Aktif ödül yok.");
    }
    const total = pool.reduce((acc, item) => acc + Number(item?.probabilityWeight || 0), 0);
    let r = Math.random() * total;
    for (const item of pool) {
        r -= Number(item?.probabilityWeight || 0);
        if (r <= 0)
            return item;
    }
    return pool[pool.length - 1];
}
function addDaysTs(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return admin.firestore.Timestamp.fromDate(d);
}
function getDiscountType(rewardType) {
    const x = safeStr(rewardType, "fixed");
    if (x === "percent" ||
        x === "fixed" ||
        x === "free_shipping" ||
        x === "gift") {
        return x;
    }
    return "fixed";
}
function getMillis(v) {
    if (!v)
        return 0;
    if (typeof v?.toMillis === "function")
        return v.toMillis();
    if (v instanceof admin.firestore.Timestamp)
        return v.toMillis();
    return 0;
}
function isCampaignLive(data) {
    const now = Date.now();
    const startsAt = getMillis(data?.startsAt);
    const endsAt = getMillis(data?.endsAt);
    if (startsAt && now < startsAt)
        return false;
    if (endsAt && now > endsAt)
        return false;
    return true;
}
exports.spinWheelV1 = (0, https_1.onCall)({
    region: "europe-west1",
    cors: true,
}, async (request) => {
    const campaignId = safeStr(request.data?.campaignId);
    const guestData = request.data?.guestData || null;
    const deviceId = normalizeDeviceId(request.data?.deviceId);
    if (!campaignId) {
        throw new https_1.HttpsError("invalid-argument", "campaignId zorunlu.");
    }
    const db = admin.firestore();
    const auth = request.auth;
    const isAdmin = auth?.token?.admin === true ||
        safeStr(auth?.token?.role).toLowerCase() === "admin" ||
        (Array.isArray(auth?.token?.roles) &&
            auth.token.roles.some((role) => safeStr(role).toLowerCase() === "admin"));
    const rawIp = normalizeIp(String(request.rawRequest.headers["x-forwarded-for"] || "")) ||
        normalizeIp(String(request.rawRequest.ip || ""));
    if (!rawIp && !isAdmin) {
        throw new https_1.HttpsError("permission-denied", "IP alınamadı.");
    }
    if (!deviceId && !isAdmin) {
        throw new https_1.HttpsError("invalid-argument", "Cihaz doğrulaması alınamadı.");
    }
    const email = normalizeEmail(guestData?.email || auth?.token?.email);
    if (!auth?.uid && !isValidEmail(email)) {
        throw new https_1.HttpsError("invalid-argument", "Geçerli bir e-posta adresi gerekli.");
    }
    const campaignRef = db.collection("wheel_campaigns").doc(campaignId);
    const campaignSnap = await campaignRef.get();
    if (!campaignSnap.exists) {
        throw new https_1.HttpsError("not-found", "Kampanya bulunamadı.");
    }
    const campaignData = campaignSnap.data() || {};
    const campaignRules = campaignData?.rules && typeof campaignData.rules === "object"
        ? campaignData.rules
        : {};
    if (!isAdmin) {
        const published = campaignData?.published === true;
        const popupEnabled = campaignData?.popupEnabled !== false;
        const isActive = campaignData?.isActive === true;
        const status = safeStr(campaignData?.status, "draft");
        if (!published || !popupEnabled || !isActive || status !== "active") {
            throw new https_1.HttpsError("failed-precondition", "Kampanya aktif değil.");
        }
        if (!isCampaignLive(campaignData)) {
            throw new https_1.HttpsError("failed-precondition", "Kampanya süresi aktif değil.");
        }
        if (!isValidEmail(email)) {
            throw new https_1.HttpsError("invalid-argument", "Kupon teslimi için geçerli bir e-posta gerekli.");
        }
        if (!auth?.uid) {
            if (!safeStr(guestData?.fullName)) {
                throw new https_1.HttpsError("invalid-argument", "Ad soyad gerekli.");
            }
            if (campaignRules?.requirePhone !== false && !safeStr(guestData?.phone)) {
                throw new https_1.HttpsError("invalid-argument", "Telefon numarası gerekli.");
            }
            if (campaignRules?.requireConsent !== false && guestData?.consent !== true) {
                throw new https_1.HttpsError("failed-precondition", "Kampanya ve iletişim onayı gerekli.");
            }
        }
    }
    const campaignTitle = safeStr(campaignData?.title) ||
        safeStr(campaignData?.heroTitle) ||
        "Şans Çarkı";
    const ipHash = sha256(`wheel:${campaignId}:ip:${rawIp}`);
    const deviceHash = sha256(`wheel:${campaignId}:device:${deviceId}`);
    const lockKeys = [
        ...(rawIp ? [`ip:${ipHash}`] : []),
        ...(deviceId ? [`device:${deviceHash}`] : []),
        ...(auth?.uid ? [`user:${sha256(auth.uid)}`] : []),
        ...(email ? [`email:${sha256(email)}`] : []),
    ];
    const lockRefs = lockKeys.map((key) => db.collection("wheel_spin_locks").doc(sha256(`${campaignId}:${key}`)));
    // Önceki sürümde kullanılan tekil kilidi de kontrol ederek mevcut
    // katılımcılara dağıtım sonrası ikinci hak açılmasını engelle.
    const legacyIpHash = sha256(`wheel:${campaignId}:${rawIp}`);
    const legacySourceKey = auth?.uid ? `user:${auth.uid}` : `guest:${legacyIpHash}`;
    const legacyLockRef = db
        .collection("wheel_spin_locks")
        .doc(`${campaignId}__${legacySourceKey}`);
    if (!isAdmin) {
        const existing = await db.getAll(...lockRefs, legacyLockRef);
        if (existing.some((snap) => snap.exists)) {
            throw new https_1.HttpsError("already-exists", "Bu kampanya için bu hesap, e-posta, cihaz veya bağlantıdan daha önce çark çevrilmiş.");
        }
        // Kilit sistemi devreye alınmadan önce oluşturulmuş çevirimleri de yakala.
        const legacySpinQueries = [];
        if (auth?.uid) {
            legacySpinQueries.push(db.collection("wheel_leads")
                .where("campaignId", "==", campaignId)
                .where("uid", "==", auth.uid)
                .limit(1)
                .get());
        }
        if (email) {
            legacySpinQueries.push(db.collection("wheel_leads")
                .where("campaignId", "==", campaignId)
                .where("email", "==", email)
                .limit(1)
                .get());
        }
        if (deviceId) {
            legacySpinQueries.push(db.collection("wheel_leads")
                .where("campaignId", "==", campaignId)
                .where("deviceHash", "==", deviceHash)
                .limit(1)
                .get());
        }
        const legacySpins = await Promise.all(legacySpinQueries);
        if (legacySpins.some((snap) => !snap.empty)) {
            throw new https_1.HttpsError("already-exists", "Bu kampanya için bu hesap, e-posta veya cihazdan daha önce çark çevrilmiş.");
        }
    }
    const rewardsSnap = await db
        .collection("wheel_rewards")
        .where("campaignId", "==", campaignId)
        .where("isActive", "==", true)
        .get();
    const rewards = rewardsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    }));
    if (!rewards.length) {
        throw new https_1.HttpsError("failed-precondition", "Bu kampanya için ödül bulunamadı.");
    }
    const winner = pickWeightedWinner(rewards);
    const couponPrefix = safeStr(winner?.couponPrefix, "WHEEL");
    const couponCode = buildCouponCode(safeStr(winner?.label, "ODUL"), couponPrefix);
    const rewardType = safeStr(winner?.rewardType, "fixed");
    const rewardValue = safeNum(winner?.value, 0);
    const discountType = getDiscountType(rewardType);
    const discountValue = discountType === "free_shipping" ? 0 : rewardValue;
    const couponDurationDays = Math.max(1, Math.min(365, safeNum(winner?.couponDurationDays, 7)));
    const singleUse = winner?.singleUse !== false;
    const minCartAmount = safeNum(winner?.minCartAmount, 0);
    await db.runTransaction(async (tx) => {
        if (!isAdmin) {
            const transactionLocks = await Promise.all([...lockRefs, legacyLockRef].map((ref) => tx.get(ref)));
            if (transactionLocks.some((snap) => snap.exists)) {
                throw new https_1.HttpsError("already-exists", "Bu kampanya için bu hesap, e-posta, cihaz veya bağlantıdan daha önce çark çevrilmiş.");
            }
            [...lockRefs, legacyLockRef].forEach((lockRef, index) => {
                tx.set(lockRef, {
                    campaignId,
                    lockType: index < lockKeys.length
                        ? lockKeys[index].split(":", 1)[0]
                        : "legacy",
                    ipHash,
                    deviceHash,
                    uid: auth?.uid || null,
                    email,
                    source: auth?.uid ? "member" : "guest",
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
        }
        if (auth?.uid) {
            const couponRef = db
                .collection("users")
                .doc(auth.uid)
                .collection("wheel_coupons")
                .doc(couponCode);
            tx.set(couponRef, {
                code: couponCode,
                label: safeStr(winner?.label),
                status: "active",
                campaignId,
                campaignTitle,
                rewardId: winner.id,
                rewardType,
                rewardValue,
                discountType,
                discountValue,
                singleUse,
                minCartAmount,
                expiresAt: addDaysTs(couponDurationDays),
                source: "wheel",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        const leadRef = db.collection("wheel_leads").doc();
        tx.set(leadRef, {
            fullName: safeStr(guestData?.fullName || auth?.token?.name),
            email,
            phone: safeStr(guestData?.phone),
            consent: auth?.uid ? true : guestData?.consent === true,
            uid: auth?.uid || null,
            campaignId,
            campaignTitle,
            rewardId: winner.id,
            rewardLabel: safeStr(winner?.label),
            rewardType,
            rewardValue,
            couponCode,
            couponStatus: "active",
            discountType,
            discountValue,
            singleUse,
            minCartAmount,
            expiresAt: addDaysTs(couponDurationDays),
            source: auth?.uid ? "wheel_member" : "wheel_guest",
            ipHash,
            deviceHash,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    firebase_functions_1.logger.info("wheel spin success", {
        campaignId,
        campaignTitle,
        rewardId: winner.id,
        rewardLabel: safeStr(winner?.label),
        uid: auth?.uid || null,
        isAdmin,
    });
    return {
        ok: true,
        winner: {
            id: winner.id,
            label: safeStr(winner?.label),
            rewardType,
            value: rewardValue,
        },
        couponCode,
        campaignTitle,
    };
});
