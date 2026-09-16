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
exports.deleteMyAccountV1 = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
function safeStr(v) {
    return String(v ?? "").trim();
}
async function deleteCollectionDocs(db, path, batchSize = 200) {
    while (true) {
        const snap = await db.collection(path).limit(batchSize).get();
        if (snap.empty)
            break;
        const batch = db.batch();
        snap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        if (snap.size < batchSize)
            break;
    }
}
async function anonymizeOrdersForUser(db, uid, email) {
    const ordersSnap = await db
        .collection("orders")
        .where("uid", "==", uid)
        .get();
    if (ordersSnap.empty)
        return;
    const chunks = ordersSnap.docs;
    for (let i = 0; i < chunks.length; i += 200) {
        const batch = db.batch();
        const part = chunks.slice(i, i + 200);
        for (const doc of part) {
            batch.set(doc.ref, {
                email: "",
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAtIso: new Date().toISOString(),
                customer: {
                    firstName: "Silinmiş",
                    lastName: "Kullanıcı",
                    phone: "",
                    email: "",
                    nationalId: "",
                    birthDate: "",
                },
                shippingAddress: {
                    fullName: "Silinmiş Kullanıcı",
                    phone: "",
                    city: "",
                    district: "",
                    addressLine: "",
                    postalCode: "",
                    note: "",
                    invoiceType: "individual",
                    firstName: "",
                    lastName: "",
                    nationalId: "",
                    companyName: "",
                    taxNumber: "",
                    taxOffice: "",
                },
                billing: {
                    invoiceType: "individual",
                    firstName: "",
                    lastName: "",
                    phone: "",
                    nationalId: "",
                    companyName: "",
                    taxNumber: "",
                    taxOffice: "",
                },
                meta: {
                    deletedAccount: true,
                    deletedAccountAt: firestore_1.FieldValue.serverTimestamp(),
                    deletedEmailMasked: email
                        ? `deleted-${uid.slice(0, 8)}`
                        : "",
                },
            }, { merge: true });
        }
        await batch.commit();
    }
}
exports.deleteMyAccountV1 = (0, https_1.onCall)({ region: "europe-west1" }, async (req) => {
    const uid = req.auth?.uid;
    const email = safeStr(req.auth?.token?.email);
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Login required.");
    }
    const db = admin.firestore();
    const userRef = db.collection("users").doc(uid);
    try {
        await deleteCollectionDocs(db, `users/${uid}/addresses`);
        await deleteCollectionDocs(db, `users/${uid}/favorites`);
        await deleteCollectionDocs(db, `users/${uid}/notifications`);
        await anonymizeOrdersForUser(db, uid, email);
        await userRef.delete();
        await admin.auth().deleteUser(uid);
        return {
            ok: true,
        };
    }
    catch (error) {
        console.error("deleteMyAccountV1 failed:", error);
        throw new https_1.HttpsError("internal", safeStr(error?.message) || "Account delete failed.");
    }
});
