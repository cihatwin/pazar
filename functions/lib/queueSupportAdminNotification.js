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
exports.queueSupportAdminNotification = void 0;
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
const firestore_1 = require("firebase-functions/v2/firestore");
if (!admin.apps.length)
    admin.initializeApp();
function safeStr(v) {
    return String(v || "").trim();
}
function clipText(text, max = 160) {
    const clean = safeStr(text).replace(/\s+/g, " ");
    if (!clean)
        return "Yeni destek mesajı geldi.";
    return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}
function resolveRole(data) {
    const role = safeStr(data.role).toLowerCase();
    const sender = safeStr(data.sender).toLowerCase();
    const senderType = safeStr(data.senderType).toLowerCase();
    if (role === "admin" || sender === "admin" || senderType === "admin") {
        return "admin";
    }
    return "user";
}
exports.queueSupportAdminNotification = (0, firestore_1.onDocumentCreated)({
    region: "europe-west1",
    document: "support_threads/{threadId}/messages/{messageId}",
}, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const msg = snap.data() || {};
    const threadId = safeStr(event.params.threadId);
    const messageId = safeStr(event.params.messageId);
    if (!threadId) {
        firebase_functions_1.logger.warn("support notify skipped: missing threadId", { messageId });
        return;
    }
    const role = resolveRole(msg);
    const text = safeStr(msg.text);
    if (role !== "user") {
        firebase_functions_1.logger.info("support notify skipped: not user message", {
            threadId,
            messageId,
            role,
        });
        return;
    }
    const db = admin.firestore();
    const threadSnap = await db.collection("support_threads").doc(threadId).get();
    const thread = threadSnap.exists ? threadSnap.data() || {} : {};
    // Eski mobil uygulamanın bildirim hattı yalnızca legacy destek
    // konuşmalarını işler. PAZAR. kendi fiziksel koleksiyonunu kullanır;
    // bu koruma, yanlışlıkla legacy koleksiyona yazılsa bile push'u keser.
    if (safeStr(thread.workspace) === "pazar_marketplace_v1") {
        firebase_functions_1.logger.info("legacy support notify skipped: marketplace workspace", {
            threadId,
            messageId,
        });
        return;
    }
    const displayName = safeStr(thread.name) ||
        safeStr(thread.fullName) ||
        safeStr(thread.email) ||
        safeStr(thread.phone) ||
        "Yeni ziyaretçi";
    const body = clipText(text || "Yeni destek mesajı geldi.");
    const usersSnap = await db.collection("users").get();
    const targets = [];
    const targetDebug = [];
    usersSnap.forEach((docSnap) => {
        const x = docSnap.data() || {};
        const userRole = safeStr(x.role).toLowerCase();
        const isActive = x.isActive !== false;
        const perms = x.permissions || {};
        const canSupportNotification = userRole === "admin" ||
            (userRole === "sub_admin" &&
                perms.support === true &&
                perms.support_notifications === true);
        if (isActive && canSupportNotification) {
            targets.push(docSnap.id);
            targetDebug.push({
                uid: docSnap.id,
                role: userRole,
                isActive,
                support: perms.support === true,
                supportNotifications: perms.support_notifications === true,
            });
        }
    });
    if (!targets.length) {
        firebase_functions_1.logger.info("support notify skipped: no admin targets", { threadId });
        return;
    }
    const url = `/admin/support/${threadId}`;
    firebase_functions_1.logger.info("support notify targets resolved", {
        threadId,
        messageId,
        targetCount: targets.length,
        targetDebug,
    });
    await db.collection("notifications").add({
        title: `Yeni destek mesajı • ${displayName}`,
        body,
        image: "",
        url,
        // Route / action bilgileri
        type: "support_thread",
        action: "open_support_thread",
        threadId,
        supportThreadId: threadId,
        messageId,
        // iOS ve web push data payload için net alan
        data: {
            type: "support_thread",
            action: "open_support_thread",
            threadId,
            supportThreadId: threadId,
            messageId,
            url,
        },
        targetRoles: ["admin", "sub_admin"],
        targetPermission: "support_notifications",
        targetUserIds: targets,
        status: "queued",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    firebase_functions_1.logger.info("support notification queued", {
        threadId,
        messageId,
        targetCount: targets.length,
    });
});
