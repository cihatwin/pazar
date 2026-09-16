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
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncWheelCouponsV1 = exports.verifyGuestWheelCoupon = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length)
    admin.initializeApp();
exports.verifyGuestWheelCoupon = (0, https_1.onCall)({
    region: "europe-west1",
    cors: true,
}, async (request) => {
    const code = String(request.data?.code || "")
        .trim()
        .toUpperCase();
    if (!code) {
        throw new https_1.HttpsError("invalid-argument", "Kupon kodu gerekli.");
    }
    const snap = await admin
        .firestore()
        .collection("wheel_leads")
        .where("couponCode", "==", code)
        .where("couponStatus", "==", "active")
        .limit(1)
        .get();
    if (snap.empty) {
        return { ok: false, found: false };
    }
    const doc = snap.docs[0];
    const data = doc.data() || {};
    // Süre kontrolü — expiresAt varsa ve geçmişse kuponu expired yap
    const expiresAt = data.expiresAt;
    if (expiresAt) {
        const expiryDate = typeof expiresAt?.toDate === "function"
            ? expiresAt.toDate()
            : expiresAt instanceof Date
                ? expiresAt
                : new Date(expiresAt);
        if (expiryDate && !isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
            // Kupon süresi dolmuş — otomatik expired işaretle
            await doc.ref.update({
                couponStatus: "expired",
                expiredAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { ok: false, found: false, expired: true };
        }
    }
    return {
        ok: true,
        found: true,
        coupon: {
            code: String(data.couponCode || ""),
            label: String(data.rewardLabel || ""),
            campaignTitle: String(data.campaignTitle || ""),
            discountType: String(data.discountType || "fixed"),
            discountValue: Number(data.discountValue || 0),
            minCartAmount: Number(data.minCartAmount || 0),
            singleUse: data.singleUse !== false,
            expiresAt: data.expiresAt || null,
        },
    };
});
exports.syncWheelCouponsV1 = (0, https_1.onCall)({
    region: "europe-west1",
    cors: true,
}, async (request) => {
    const uid = String(request.auth?.uid || "").trim();
    const email = String(request.auth?.token?.email || "").trim().toLowerCase();
    if (!uid || !email) {
        throw new https_1.HttpsError("unauthenticated", "Kupon eşitlemek için giriş gerekli.");
    }
    const db = admin.firestore();
    const leads = await db
        .collection("wheel_leads")
        .where("email", "==", email)
        .limit(50)
        .get();
    const synced = [];
    for (const lead of leads.docs) {
        const data = lead.data() || {};
        const code = String(data.couponCode || "").trim().toUpperCase();
        const status = String(data.couponStatus || "active");
        const claimedUid = String(data.uid || "").trim();
        const expiresAt = data.expiresAt;
        const expiresAtMs = typeof expiresAt?.toMillis === "function" ? expiresAt.toMillis() : 0;
        if (!code || status !== "active" || (claimedUid && claimedUid !== uid))
            continue;
        if (expiresAtMs && expiresAtMs <= Date.now()) {
            await lead.ref.set({
                couponStatus: "expired",
                expiredAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            continue;
        }
        const couponRef = db.collection("users").doc(uid).collection("wheel_coupons").doc(code);
        await db.runTransaction(async (tx) => {
            const [freshLead, coupon] = await Promise.all([tx.get(lead.ref), tx.get(couponRef)]);
            if (!freshLead.exists)
                return;
            const fresh = freshLead.data() || {};
            if (String(fresh.couponStatus || "active") !== "active")
                return;
            const freshUid = String(fresh.uid || "").trim();
            if (freshUid && freshUid !== uid)
                return;
            if (!coupon.exists) {
                tx.set(couponRef, {
                    code,
                    label: String(fresh.rewardLabel || "Kampanya Kuponu"),
                    status: "active",
                    campaignId: String(fresh.campaignId || ""),
                    campaignTitle: String(fresh.campaignTitle || "6nci Kampanyası"),
                    rewardId: String(fresh.rewardId || ""),
                    rewardType: String(fresh.rewardType || fresh.discountType || "fixed"),
                    rewardValue: Number(fresh.rewardValue || fresh.discountValue || 0),
                    discountType: String(fresh.discountType || "fixed"),
                    discountValue: Number(fresh.discountValue || 0),
                    minCartAmount: Number(fresh.minCartAmount || 0),
                    singleUse: fresh.singleUse !== false,
                    expiresAt: fresh.expiresAt || null,
                    source: String(fresh.source || "wheel_guest"),
                    claimedFromGuest: true,
                    createdAt: fresh.createdAt || admin.firestore.FieldValue.serverTimestamp(),
                    claimedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            tx.set(lead.ref, {
                uid,
                claimedAt: admin.firestore.FieldValue.serverTimestamp(),
                claimedToAccount: true,
            }, { merge: true });
        });
        synced.push(code);
    }
    return { ok: true, count: synced.length, couponCodes: synced };
});
