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
exports.guestCheckoutStartV1 = exports.cancelOrderAndRestoreStockV1 = exports.confirmOrderPaymentV1 = exports.createOrderV1 = exports.queuePaidCardOrderAdminNotification = exports.queuePaidCardOrderCreatedAdminNotification = exports.queueTransferOrderAdminNotification = void 0;
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const crypto_1 = require("crypto");
const https_1 = require("firebase-functions/v2/https");
const firestore_2 = require("firebase-functions/v2/firestore");
if (!admin.apps.length) {
    admin.initializeApp();
}
function orderNotifyMoneyAmount(v) {
    if (v && typeof v === "object") {
        return toNum(v.amount, 0);
    }
    return toNum(v, 0);
}
function orderNotifyFormatTry(amount) {
    try {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
        }).format(amount);
    }
    catch {
        return `${Number(amount || 0).toFixed(2)} TRY`;
    }
}
function orderNotifyCustomerName(order) {
    const customer = order?.customer || {};
    const shipping = order?.shippingAddress || {};
    const shippingFullName = safeStr(shipping?.fullName);
    const shippingComposed = `${safeStr(shipping?.firstName)} ${safeStr(shipping?.lastName)}`.trim();
    const customerComposed = `${safeStr(customer?.firstName)} ${safeStr(customer?.lastName)}`.trim();
    return shippingFullName || shippingComposed || customerComposed || "Yeni müşteri";
}
function orderNotifyFirstItemTitle(order) {
    const items = Array.isArray(order?.items) ? order.items : [];
    const first = items[0] || {};
    const title = first?.title;
    if (typeof title === "string")
        return safeStr(title);
    if (title && typeof title === "object") {
        return safeStr(title.tr) || safeStr(title.en);
    }
    return safeStr(first?.name) || safeStr(first?.sku) || "Ürün";
}
function orderNotifyPaymentLabel(order) {
    const provider = safeStr(order?.payment?.provider).toLowerCase();
    const method = safeStr(order?.payment?.method).toLowerCase();
    if (provider === "paytr" || method === "card")
        return "Kart / PayTR";
    if (provider === "manual" || method === "transfer")
        return "Havale / EFT";
    return "Ödeme";
}
function isTransferOrder(order) {
    const provider = safeStr(order?.payment?.provider).toLowerCase();
    const method = safeStr(order?.payment?.method).toLowerCase();
    return provider === "manual" || method === "transfer" || method === "havale" || method === "eft";
}
function isCardOrder(order) {
    const provider = safeStr(order?.payment?.provider).toLowerCase();
    const method = safeStr(order?.payment?.method).toLowerCase();
    return provider === "paytr" || method === "card";
}
function isPaidOrder(order) {
    const status = safeStr(order?.status).toLowerCase();
    const paymentStatus = safeStr(order?.paymentStatus).toLowerCase();
    return status === "paid" || paymentStatus === "paid";
}
async function resolveOrderNotificationTargets(db) {
    const usersSnap = await db.collection("users").get();
    const targets = [];
    const targetDebug = [];
    usersSnap.forEach((docSnap) => {
        const x = docSnap.data() || {};
        const userRole = safeStr(x.role).toLowerCase();
        const isActive = x.isActive !== false;
        const perms = x.permissions || {};
        const isAdmin = userRole === "admin";
        const canOrderNotification = isAdmin ||
            (userRole === "sub_admin" &&
                (perms.orders === true ||
                    perms.order === true ||
                    perms.orders_notifications === true ||
                    perms.order_notifications === true) &&
                perms.orders_notifications !== false &&
                perms.order_notifications !== false);
        if (isActive && canOrderNotification) {
            targets.push(docSnap.id);
            targetDebug.push({
                uid: docSnap.id,
                role: userRole,
                isActive,
                orders: perms.orders === true || perms.order === true,
                ordersNotifications: perms.orders_notifications === true ||
                    perms.order_notifications === true,
            });
        }
    });
    return {
        targets,
        targetDebug,
    };
}
async function queueOrderAdminNotification(params) {
    const { db, orderId, order, kind } = params;
    if (!orderId)
        return;
    const { targets, targetDebug } = await resolveOrderNotificationTargets(db);
    if (!targets.length) {
        firebase_functions_1.logger.info("order notify skipped: no admin targets", {
            orderId,
            kind,
        });
        return;
    }
    const totalAmount = orderNotifyMoneyAmount(order?.total);
    const totalText = orderNotifyFormatTry(totalAmount);
    const customerName = orderNotifyCustomerName(order);
    const itemTitle = orderNotifyFirstItemTitle(order);
    const itemCount = Array.isArray(order?.items) ? order.items.length : 0;
    const paymentLabel = orderNotifyPaymentLabel(order);
    const title = kind === "card_paid"
        ? "Yeni kart siparişi ödendi"
        : "Yeni havale/EFT siparişi geldi";
    const body = `${customerName} • ${totalText} • ${itemTitle}${itemCount > 1 ? ` +${itemCount - 1}` : ""}`;
    const url = `/admin/orders/${encodeURIComponent(orderId)}`;
    const nowIso = new Date().toISOString();
    const notificationId = `order_${kind}_${orderId}`;
    firebase_functions_1.logger.info("order notify targets resolved", {
        orderId,
        kind,
        targetCount: targets.length,
        targetDebug,
    });
    const notificationRef = db.collection("notifications").doc(notificationId);
    const existingNotification = await notificationRef.get();
    if (existingNotification.exists) {
        firebase_functions_1.logger.info("order notification skipped: already exists", {
            orderId,
            kind,
            notificationId,
        });
        return;
    }
    await notificationRef.create({
        title,
        body,
        image: "",
        url,
        type: "new_order",
        action: "open_order",
        orderId,
        paymentLabel,
        paymentMethod: safeStr(order?.payment?.method),
        paymentProvider: safeStr(order?.payment?.provider),
        paymentStatus: safeStr(order?.paymentStatus),
        orderStatus: safeStr(order?.status),
        totalTry: totalAmount,
        data: {
            type: "new_order",
            action: "open_order",
            orderId,
            url,
            kind,
            paymentLabel,
            paymentMethod: safeStr(order?.payment?.method),
            paymentProvider: safeStr(order?.payment?.provider),
            paymentStatus: safeStr(order?.paymentStatus),
            orderStatus: safeStr(order?.status),
            totalTry: String(totalAmount),
        },
        targetRoles: ["admin", "sub_admin"],
        targetPermission: "orders_notifications",
        targetUserIds: targets,
        priority: kind === "card_paid" ? "high" : "normal",
        status: "queued",
        createdBy: "orders_notify",
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        createdAtIso: nowIso,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAtIso: nowIso,
    });
    await db.collection("system_logs").doc(`ORDER_NOTIFY_${kind}_${orderId}`).set({
        level: "info",
        status: "open",
        source: "orders",
        code: kind === "card_paid"
            ? "ORDER_CARD_PAID_NOTIFICATION_QUEUED"
            : "ORDER_TRANSFER_NOTIFICATION_QUEUED",
        message: kind === "card_paid"
            ? `Kart siparişi ödeme bildirimi kuyruğa alındı: ${orderId}`
            : `Havale/EFT sipariş bildirimi kuyruğa alındı: ${orderId}`,
        details: {
            orderId,
            kind,
            totalAmount,
            paymentMethod: safeStr(order?.payment?.method),
            paymentProvider: safeStr(order?.payment?.provider),
            paymentStatus: safeStr(order?.paymentStatus),
            orderStatus: safeStr(order?.status),
            targetCount: targets.length,
        },
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        createdAtIso: nowIso,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAtIso: nowIso,
    }, { merge: true });
    firebase_functions_1.logger.info("order notification queued", {
        orderId,
        kind,
        targetCount: targets.length,
        notificationId,
    });
}
exports.queueTransferOrderAdminNotification = (0, firestore_2.onDocumentCreated)({
    region: "europe-west1",
    document: "orders/{orderId}",
}, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const orderId = safeStr(event.params.orderId);
    const order = snap.data() || {};
    if (!orderId) {
        firebase_functions_1.logger.warn("transfer order notify skipped: missing orderId");
        return;
    }
    if (!isTransferOrder(order)) {
        firebase_functions_1.logger.info("transfer order notify skipped: not transfer order", {
            orderId,
            paymentMethod: safeStr(order?.payment?.method),
            paymentProvider: safeStr(order?.payment?.provider),
        });
        return;
    }
    const status = safeStr(order?.status).toLowerCase();
    if (status === "cancelled" || status === "refunded") {
        firebase_functions_1.logger.info("transfer order notify skipped: closed order", {
            orderId,
            status,
        });
        return;
    }
    const db = admin.firestore();
    await queueOrderAdminNotification({
        db,
        orderId,
        order,
        kind: "transfer_created",
    });
});
exports.queuePaidCardOrderCreatedAdminNotification = (0, firestore_2.onDocumentCreated)({
    region: "europe-west1",
    document: "orders/{orderId}",
}, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const orderId = safeStr(event.params.orderId);
    const order = snap.data() || {};
    if (!orderId) {
        firebase_functions_1.logger.warn("paid card order create notify skipped: missing orderId");
        return;
    }
    if (!isCardOrder(order)) {
        firebase_functions_1.logger.info("paid card order create notify skipped: not card order", {
            orderId,
            paymentMethod: safeStr(order?.payment?.method),
            paymentProvider: safeStr(order?.payment?.provider),
        });
        return;
    }
    if (!isPaidOrder(order)) {
        firebase_functions_1.logger.info("paid card order create notify skipped: not paid on create", {
            orderId,
            status: safeStr(order?.status),
            paymentStatus: safeStr(order?.paymentStatus),
        });
        return;
    }
    const db = admin.firestore();
    await queueOrderAdminNotification({
        db,
        orderId,
        order,
        kind: "card_paid",
    });
});
exports.queuePaidCardOrderAdminNotification = (0, firestore_2.onDocumentUpdated)({
    region: "europe-west1",
    document: "orders/{orderId}",
}, async (event) => {
    const before = event.data?.before.data() || {};
    const after = event.data?.after.data() || {};
    const orderId = safeStr(event.params.orderId);
    if (!orderId) {
        firebase_functions_1.logger.warn("paid card order notify skipped: missing orderId");
        return;
    }
    if (!isCardOrder(after)) {
        firebase_functions_1.logger.info("paid card order notify skipped: not card order", {
            orderId,
            paymentMethod: safeStr(after?.payment?.method),
            paymentProvider: safeStr(after?.payment?.provider),
        });
        return;
    }
    const wasPaid = isPaidOrder(before);
    const nowPaid = isPaidOrder(after);
    if (wasPaid || !nowPaid) {
        firebase_functions_1.logger.info("paid card order notify skipped: paid transition not matched", {
            orderId,
            wasPaid,
            nowPaid,
            beforeStatus: safeStr(before?.status),
            beforePaymentStatus: safeStr(before?.paymentStatus),
            afterStatus: safeStr(after?.status),
            afterPaymentStatus: safeStr(after?.paymentStatus),
        });
        return;
    }
    const db = admin.firestore();
    await queueOrderAdminNotification({
        db,
        orderId,
        order: after,
        kind: "card_paid",
    });
});
/* ---------------- helpers ---------------- */
function deepClean(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (Array.isArray(obj)) {
        return obj
            .map((x) => deepClean(x))
            .filter((x) => x !== undefined);
    }
    if (typeof obj === "object") {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            if (v === undefined)
                continue;
            out[k] = deepClean(v);
        }
        return out;
    }
    return obj;
}
function toNum(v, fb = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fb;
}
function clampInt(n, min, max) {
    const x = Math.floor(toNum(n, min));
    return Math.max(min, Math.min(max, x));
}
function money(amount) {
    return { amount: Number(Number(amount || 0).toFixed(2)), currency: "TRY" };
}
function safeStr(v) {
    return String(v ?? "").trim();
}
function pickAnyText(v) {
    if (!v)
        return "";
    if (typeof v === "string")
        return safeStr(v);
    if (typeof v === "object") {
        return (safeStr(v.tr) ||
            safeStr(v.en) ||
            safeStr(v.title) ||
            safeStr(v.label) ||
            "");
    }
    return "";
}
function normalizeSelectedServices(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .map((service) => {
        const id = safeStr(service?.id);
        const code = safeStr(service?.code);
        const title = service?.title || null;
        const priceTry = Math.max(0, toNum(service?.priceTry, 0));
        const freeOverTry = Math.max(0, toNum(service?.freeOverTry, 0));
        const hay = [id, code, pickAnyText(title), service?.label, service?.name]
            .map((x) => safeStr(x).toLocaleLowerCase("tr-TR"))
            .join(" ");
        const isGiftPackage = service?.isGiftPackage === true ||
            hay.includes("hediye") ||
            hay.includes("gift") ||
            hay.includes("paket");
        return deepClean({
            id,
            code,
            title,
            priceTry,
            freeOverTry,
            isGiftPackage,
        });
    })
        .filter((service) => safeStr(service.id) || safeStr(service.code) || pickAnyText(service.title));
}
function resolveGiftPackageFromClientQuote(clientQuote) {
    const selectedServices = normalizeSelectedServices(clientQuote?.selectedServices);
    const giftService = selectedServices.find((service) => {
        if (service?.isGiftPackage === true)
            return true;
        const hay = [
            service?.id,
            service?.code,
            pickAnyText(service?.title),
        ]
            .map((x) => safeStr(x).toLocaleLowerCase("tr-TR"))
            .join(" ");
        return hay.includes("hediye") || hay.includes("gift") || hay.includes("paket");
    });
    const giftEnabled = Boolean(giftService);
    const giftNote = safeStr(clientQuote?.giftNote) ||
        safeStr(clientQuote?.giftMessage) ||
        safeStr(clientQuote?.note);
    return {
        selectedServices,
        giftEnabled,
        giftService: giftService || null,
        giftNote,
    };
}
function normalizeQuoteItems(raw) {
    return Array.isArray(raw) ? raw : [];
}
function makeQuoteItemKey(item) {
    const productId = safeStr(item?.productId || item?.id);
    const slug = safeStr(item?.slug);
    if (productId)
        return `product:${productId}`;
    if (slug)
        return `slug:${slug}`;
    return "";
}
function buildClientQuoteItemMap(clientQuote) {
    const map = new Map();
    for (const item of normalizeQuoteItems(clientQuote?.items)) {
        const productId = safeStr(item?.productId || item?.id);
        const slug = safeStr(item?.slug);
        if (productId)
            map.set(`product:${productId}`, item);
        if (slug)
            map.set(`slug:${slug}`, item);
    }
    return map;
}
function findClientQuoteItem(item, quoteMap) {
    const productId = safeStr(item?.productId || item?.id);
    const slug = safeStr(item?.slug);
    return (quoteMap.get(`product:${productId}`) ||
        quoteMap.get(`slug:${slug}`) ||
        null);
}
function cleanSelectedVariantItems(raw) {
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const v of raw) {
        const groupId = safeStr(v?.groupId);
        const value = safeStr(v?.value);
        if (!groupId || !value)
            continue;
        const gram = Math.max(0, toNum(v?.hasGram ?? v?.weightGram ?? v?.gram, 0));
        const item = {
            groupId,
            groupLabel: safeStr(v?.groupLabel) || groupId,
            value,
            label: safeStr(v?.label) || value,
            priceDelta: Math.max(0, toNum(v?.priceDelta, 0)),
            ...(gram > 0
                ? {
                    hasGram: gram,
                    weightGram: gram,
                    gram,
                }
                : {}),
        };
        out.push(deepClean(item));
    }
    return out;
}
function getVariantGramFromItems(items) {
    const found = items.find((v) => {
        const gram = toNum(v?.hasGram ?? v?.weightGram ?? v?.gram, 0);
        return gram > 0;
    });
    return Math.max(0, toNum(found?.hasGram ?? found?.weightGram ?? found?.gram, 0));
}
function getQuoteUnitPriceTry(quoteItem) {
    return Math.max(0, toNum(quoteItem?.unitPriceTry ??
        quoteItem?.resolvedUnitPrice ??
        quoteItem?.priceTry, 0));
}
function getQuoteLineTry(quoteItem, unitTry, qty) {
    const lineFromQuote = toNum(quoteItem?.lineTry, 0);
    if (lineFromQuote > 0) {
        return Math.max(0, Number(lineFromQuote.toFixed(2)));
    }
    return Math.max(0, Number((unitTry * qty).toFixed(2)));
}
function normalizeAddressLine(...parts) {
    const chunks = parts
        .flatMap((p) => String(p ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\s*\/\s*/g, " / ")
        .split("/"))
        .map((x) => String(x || "").trim().replace(/\s+/g, " "))
        .filter(Boolean);
    const seen = new Set();
    const out = [];
    for (const chunk of chunks) {
        const key = chunk
            .toLocaleLowerCase("tr-TR")
            .replace(/[^\p{L}\p{N}]+/gu, "");
        if (!key)
            continue;
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(chunk);
    }
    return out.join(" / ");
}
// variant'i Firestore'a uygun hale getir (undefined alanı KALDIR)
function safeVariant(v) {
    if (!v || typeof v !== "object" || Array.isArray(v))
        return undefined;
    const out = {};
    for (const [k, val] of Object.entries(v)) {
        const key = safeStr(k);
        const value = safeStr(val);
        if (!key || !value)
            continue;
        out[key] = value;
    }
    return Object.keys(out).length ? out : undefined;
}
function pickTitle(p) {
    const tr = String(p?.title?.tr || p?.titleTR || p?.name?.tr || p?.nameTR || p?.title || p?.name || "Ürün").trim() || "Ürün";
    const en = String(p?.title?.en || p?.titleEN || p?.name?.en || p?.nameEN || p?.title || p?.name || "Product").trim() || "Product";
    return { tr, en };
}
function normalizeRateKey(k) {
    const s = safeStr(k);
    return s ? s.replace(/\s+/g, "_").toUpperCase() : "GRAM_ALTIN";
}
function getRateTry(ratesDoc, rateKey) {
    if (!ratesDoc)
        return 0;
    const key = normalizeRateKey(rateKey);
    const items = Array.isArray(ratesDoc?.items) ? ratesDoc.items : [];
    for (const it of items) {
        const k = normalizeRateKey(it?.key || it?.rateKey || it?.code || it?.name);
        if (k !== key)
            continue;
        const candidates = [it?.try, it?.sellTry, it?.sell, it?.valueTry, it?.value, it?.priceTry, it?.price];
        for (const c of candidates) {
            const n = toNum(c, 0);
            if (n > 0)
                return n;
        }
    }
    const map1 = ratesDoc?.itemsMap || ratesDoc?.map || ratesDoc;
    const v = map1?.[key];
    const n = toNum(v?.try ?? v?.sell ?? v?.value ?? v, 0);
    return n > 0 ? n : 0;
}
function productUsesRates(product) {
    const pricing = product?.pricing || {};
    const catPricing = product?.categoryPricing || product?.resolvedCategoryPricing || {};
    const explicitOff = product?.dynamicPricing === false ||
        pricing?.enabled === false ||
        pricing?.mode === "fixed" ||
        pricing?.type === "fixed" ||
        pricing?.dynamic === false;
    if (explicitOff)
        return false;
    const ownDynamic = product?.dynamicPricing === true ||
        product?.priceMode === "dynamic" ||
        product?.pricingMode === "dynamic" ||
        pricing?.dynamic === true ||
        pricing?.mode === "dynamic" ||
        pricing?.type === "dynamic";
    const ownRateKey = product?.rateKey || product?.priceRateCode || pricing?.rateKey || pricing?.rateCode;
    const ownGramBased = pricing?.model === "gram" || product?.pricingModel === "gram" || product?.priceModel === "gram";
    const catEnabled = catPricing?.enabled === true &&
        (catPricing?.dynamic === true || catPricing?.mode === "dynamic" || catPricing?.type === "dynamic" || catPricing?.model === "gram") &&
        !!(catPricing?.rateKey || catPricing?.rateCode);
    return (ownDynamic && (ownGramBased || !!ownRateKey)) || catEnabled;
}
function resolveUnitPriceTry(product, ratesDoc) {
    const base = toNum(product?.finalPrice, 0) ||
        toNum(product?.priceTry, 0) ||
        toNum(product?.price, 0) ||
        toNum(product?.salePrice, 0) ||
        0;
    if (!productUsesRates(product))
        return base;
    const pricing = product?.pricing || {};
    const catPricing = product?.resolvedCategoryPricing || product?.categoryPricing || {};
    const rateKey = safeStr(product?.rateKey ||
        product?.priceRateCode ||
        pricing?.rateKey ||
        pricing?.rateCode ||
        catPricing?.rateKey ||
        catPricing?.rateCode ||
        "GRAM_ALTIN");
    const weightGram = toNum(product?.weightGram ?? pricing?.weightGram ?? catPricing?.weightGram, 0);
    const markupTry = toNum(product?.markupTry ?? pricing?.markupTry ?? catPricing?.markupTry, 0);
    const markupPercent = toNum(product?.markupPercent ?? pricing?.markupPercent ?? catPricing?.markupPercent, 0);
    const rate = getRateTry(ratesDoc, rateKey);
    if (rate <= 0 || weightGram <= 0)
        return base;
    const raw = weightGram * rate;
    const withMarkup = raw + Math.max(0, markupTry);
    const withPct = withMarkup * (1 + Math.max(0, markupPercent) / 100);
    const out = Number(withPct.toFixed(2));
    return out > 0 ? out : base;
}
async function getProductDocFlexible(db, item) {
    const id = safeStr(item.productId);
    const slug = safeStr(item.slug);
    if (id) {
        const snap = await db.collection("products").doc(id).get();
        if (snap.exists)
            return { id: snap.id, ...snap.data() };
    }
    const candidates = [slug, id].filter(Boolean);
    for (const s of candidates) {
        const qs = await db.collection("products").where("slug", "==", s).limit(1).get();
        if (!qs.empty) {
            const d = qs.docs[0];
            return { id: d.id, ...d.data() };
        }
    }
    return null;
}
async function applyPaidOrderStockTx(db, orderId, paymentRef) {
    const cleanOrderId = safeStr(orderId);
    const cleanPaymentRef = safeStr(paymentRef);
    if (!cleanOrderId) {
        throw new https_1.HttpsError("invalid-argument", "orderId required.");
    }
    const orderRef = db.collection("orders").doc(cleanOrderId);
    return db.runTransaction(async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists) {
            throw new https_1.HttpsError("not-found", "Order not found.");
        }
        const order = orderSnap.data();
        const nowIso = new Date().toISOString();
        if (order.stockApplied === true) {
            tx.update(orderRef, {
                status: "paid",
                paymentStatus: "paid",
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAtIso: nowIso,
                paidAtIso: order.paidAtIso || nowIso,
                "payment.paidAt": order.payment?.paidAt || firestore_1.FieldValue.serverTimestamp(),
                ...(cleanPaymentRef ? { "payment.ref": cleanPaymentRef } : {}),
            });
            return {
                orderId: cleanOrderId,
                alreadyApplied: true,
            };
        }
        if (order.status !== "pending_payment") {
            throw new https_1.HttpsError("failed-precondition", "Order is not pending payment.");
        }
        const items = Array.isArray(order.items) ? order.items : [];
        if (!items.length) {
            throw new https_1.HttpsError("failed-precondition", "Order has no items.");
        }
        const prodRefs = items.map((it) => {
            const pid = safeStr(it.productId);
            if (!pid) {
                throw new https_1.HttpsError("failed-precondition", "Invalid productId in order.");
            }
            return db.collection("products").doc(pid);
        });
        const prodSnaps = await Promise.all(prodRefs.map((ref) => tx.get(ref)));
        const stockPlan = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const qty = clampInt(item.qty, 1, 99);
            const psnap = prodSnaps[i];
            if (!psnap.exists) {
                throw new https_1.HttpsError("not-found", `Product not found: ${safeStr(item.productId)}`);
            }
            const pdata = psnap.data();
            const currentStock = Math.max(0, Math.floor(toNum(pdata?.stock, 0)));
            if (currentStock < qty) {
                throw new https_1.HttpsError("failed-precondition", `Out of stock during payment confirm: ${psnap.id}`);
            }
            stockPlan.push({
                ref: prodRefs[i],
                newStock: currentStock - qty,
            });
        }
        for (const plan of stockPlan) {
            tx.update(plan.ref, {
                stock: plan.newStock,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        tx.update(orderRef, {
            status: "paid",
            paymentStatus: "paid",
            stockApplied: true,
            stockAppliedAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAtIso: nowIso,
            paidAtIso: nowIso,
            "payment.paidAt": firestore_1.FieldValue.serverTimestamp(),
            ...(cleanPaymentRef ? { "payment.ref": cleanPaymentRef } : {}),
        });
        return {
            orderId: cleanOrderId,
            alreadyApplied: false,
        };
    });
}
/* ---------------- createOrderV1 ---------------- */
exports.createOrderV1 = (0, https_1.onCall)({ region: "europe-west1" }, async (req) => {
    const uid = req.auth?.uid;
    const email = req.auth?.token?.email ? String(req.auth.token.email) : "";
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Login required.");
    const data = (req.data || {});
    const clientQuote = data.clientQuote || {};
    const quoteItemMap = buildClientQuoteItemMap(clientQuote);
    const hasClientQuoteItems = quoteItemMap.size > 0;
    const giftInfoFromQuote = resolveGiftPackageFromClientQuote(clientQuote);
    const giftEnabled = giftInfoFromQuote.giftEnabled ||
        data.packaging?.giftPackage === true ||
        data.packaging?.giftWrap === true ||
        data.packaging?.gift === true ||
        data.giftPackage === true ||
        data.giftWrap === true;
    const giftNote = safeStr(giftInfoFromQuote.giftNote) ||
        safeStr(data.packaging?.note) ||
        safeStr(data.packaging?.message) ||
        safeStr(data.giftNote) ||
        safeStr(data.giftMessage) ||
        safeStr(data.giftPackageNote);
    const giftInfo = {
        ...giftInfoFromQuote,
        giftEnabled,
        giftNote,
    };
    const serviceTotalTry = Math.max(0, toNum(clientQuote.serviceTotalTry, data.serviceTotalTry || 0));
    const quoteDiscountTry = Math.max(0, toNum(clientQuote.discountTry, 0));
    const locale = data.locale === "en" ? "en" : "tr";
    const userAgent = safeStr(data.userAgent);
    const customerProfile = {
        firstName: safeStr(data.customerProfile?.firstName),
        lastName: safeStr(data.customerProfile?.lastName),
        phone: safeStr(data.customerProfile?.phone),
        email: safeStr(data.customerProfile?.email) || email || "",
        nationalId: safeStr(data.customerProfile?.tcNo),
        birthDate: safeStr(data.customerProfile?.birthDate),
    };
    const paymentMethod = data.paymentMethod === "transfer" ? "transfer" : "card";
    const reserveStockNow = paymentMethod === "transfer";
    const paymentProvider = paymentMethod === "transfer" ? "manual" : "paytr";
    const addr = data.shippingAddress || {};
    const address = {
        fullName: safeStr(addr.fullName),
        phone: safeStr(addr.phone),
        city: safeStr(addr.city),
        district: safeStr(addr.district),
        addressLine: normalizeAddressLine(addr.addressLine),
        postalCode: safeStr(addr.postalCode),
        note: safeStr(addr.note),
        invoiceType: safeStr(addr.invoiceType) === "company" ? "company" : "individual",
        firstName: safeStr(addr.firstName),
        lastName: safeStr(addr.lastName),
        nationalId: safeStr(addr.nationalId),
        companyName: safeStr(addr.companyName),
        taxNumber: safeStr(addr.taxNumber),
        taxOffice: safeStr(addr.taxOffice),
    };
    if (address.invoiceType === "company") {
        if (!address.companyName) {
            throw new https_1.HttpsError("invalid-argument", "Company name required.");
        }
        if (!address.taxNumber) {
            throw new https_1.HttpsError("invalid-argument", "Tax number required.");
        }
        if (!address.taxOffice) {
            throw new https_1.HttpsError("invalid-argument", "Tax office required.");
        }
    }
    if (address.invoiceType === "individual" && address.nationalId && address.nationalId.length !== 11) {
        throw new https_1.HttpsError("invalid-argument", "National ID invalid.");
    }
    if (!address.fullName)
        throw new https_1.HttpsError("invalid-argument", "Full name required.");
    if (!address.phone)
        throw new https_1.HttpsError("invalid-argument", "Phone required.");
    if (!address.city)
        throw new https_1.HttpsError("invalid-argument", "City required.");
    if (!address.district)
        throw new https_1.HttpsError("invalid-argument", "District required.");
    if (!address.addressLine)
        throw new https_1.HttpsError("invalid-argument", "Address required.");
    const rawItems = Array.isArray(data.items) ? data.items : [];
    if (!rawItems.length)
        throw new https_1.HttpsError("invalid-argument", "Cart empty.");
    // merge same productIds, and CLEAN variant
    const merged = new Map();
    for (const it of rawItems) {
        const pid = safeStr(it?.productId);
        if (!pid)
            continue;
        const qty = clampInt(it?.qty, 1, 99);
        const prev = merged.get(pid);
        const nextVariant = safeVariant(it?.variant) ?? prev?.variant;
        const selectedSize = safeStr(it?.selectedSize) || prev?.selectedSize;
        const selectedVariants = safeVariant(it?.selectedVariants) ?? prev?.selectedVariants;
        const selectedVariantItems = Array.isArray(it?.selectedVariantItems)
            ? cleanSelectedVariantItems(it.selectedVariantItems)
            : prev?.selectedVariantItems;
        const selectedVariantGram = Math.max(0, toNum(it?.selectedVariantGram ??
            it?.weightGram ??
            it?.hasGram ??
            getVariantGramFromItems(selectedVariantItems || []), 0)) || prev?.selectedVariantGram || 0;
        merged.set(pid, {
            productId: pid,
            ...(safeStr(it?.slug) ? { slug: safeStr(it?.slug) } : {}),
            qty: clampInt((prev?.qty || 0) + qty, 1, 99),
            ...(nextVariant ? { variant: nextVariant } : {}),
            ...(selectedSize ? { selectedSize } : {}),
            ...(selectedVariants ? { selectedVariants } : {}),
            ...(selectedVariantItems?.length ? { selectedVariantItems } : {}),
            ...(selectedVariantGram > 0
                ? {
                    selectedVariantGram,
                    weightGram: selectedVariantGram,
                    hasGram: selectedVariantGram,
                }
                : {}),
        });
    }
    const items = Array.from(merged.values());
    if (!items.length)
        throw new https_1.HttpsError("invalid-argument", "Cart empty.");
    const db = admin.firestore();
    const ratesSnap = await db.collection("rates").doc("latest").get();
    const ratesDoc = ratesSnap.exists ? ratesSnap.data() : null;
    const result = await db.runTransaction(async (tx) => {
        const stockPlan = [];
        const orderItems = [];
        const productDocs = [];
        for (const it of items) {
            const p = await getProductDocFlexible(db, it);
            if (!p)
                throw new https_1.HttpsError("not-found", `Product not found: ${it.productId}`);
            productDocs.push({ item: it, doc: p });
        }
        for (const { item, doc: p } of productDocs) {
            const qty = clampInt(item.qty, 1, 99);
            const stock = Math.max(0, Math.floor(toNum(p?.stock, 0)));
            if (stock < qty) {
                throw new https_1.HttpsError("failed-precondition", `Out of stock: ${safeStr(p?.slug || p?.id)} (stock=${stock}, need=${qty})`);
            }
            const productRef = db.collection("products").doc(String(p.id));
            if (reserveStockNow) {
                stockPlan.push({
                    ref: productRef,
                    newStock: stock - qty,
                });
            }
            const quoteItem = findClientQuoteItem(item, quoteItemMap);
            const selectedVariantItemsValue = Array.isArray(item.selectedVariantItems)
                ? item.selectedVariantItems
                : [];
            const selectedVariantGram = Math.max(0, toNum(item.selectedVariantGram ??
                item.weightGram ??
                item.hasGram ??
                quoteItem?.selectedVariantGram ??
                quoteItem?.weightGram ??
                quoteItem?.hasGram ??
                getVariantGramFromItems(selectedVariantItemsValue), 0));
            const pricingProduct = selectedVariantGram > 0
                ? {
                    ...p,
                    gram: selectedVariantGram,
                    hasGram: selectedVariantGram,
                    weightGram: selectedVariantGram,
                    weightGr: selectedVariantGram,
                    pricing: p?.pricing
                        ? {
                            ...p.pricing,
                            gram: selectedVariantGram,
                            hasGram: selectedVariantGram,
                            weightGram: selectedVariantGram,
                        }
                        : p?.pricing,
                }
                : p;
            const quoteUnitTry = getQuoteUnitPriceTry(quoteItem);
            const fallbackUnitTry = resolveUnitPriceTry(pricingProduct, ratesDoc);
            const unitTry = quoteUnitTry > 0 ? quoteUnitTry : fallbackUnitTry;
            const unit = Math.max(0, Number(unitTry.toFixed(2)));
            const line = getQuoteLineTry(quoteItem, unit, qty);
            const imageValue = safeStr(p?.image || p?.mainImage || (Array.isArray(p?.images) ? p.images[0] : ""));
            const skuValue = safeStr(p?.sku);
            const slugValue = safeStr(p?.slug);
            const variantValue = safeVariant(item.variant);
            const selectedSizeValue = safeStr(item.selectedSize);
            const selectedVariantsValue = safeVariant(item.selectedVariants);
            orderItems.push({
                productId: String(p.id),
                title: pickTitle(p),
                qty,
                unitPrice: money(unit),
                lineTotal: money(line),
                ...(skuValue ? { sku: skuValue } : {}),
                ...(imageValue ? { image: imageValue } : {}),
                ...(slugValue ? { slug: slugValue } : {}),
                ...(variantValue ? { variant: variantValue } : {}),
                ...(selectedSizeValue ? { selectedSize: selectedSizeValue } : {}),
                ...(selectedVariantsValue ? { selectedVariants: selectedVariantsValue } : {}),
                ...(selectedVariantItemsValue.length ? { selectedVariantItems: selectedVariantItemsValue } : {}),
                ...(selectedVariantGram > 0
                    ? {
                        selectedVariantGram,
                        weightGram: selectedVariantGram,
                        hasGram: selectedVariantGram,
                    }
                    : {}),
            });
        }
        // ✅ EN KRİTİK: Firestore'a gidecek items'ı garanti temizle
        const safeOrderItems = orderItems.map((x) => ({
            productId: x.productId,
            title: x.title,
            qty: x.qty,
            unitPrice: x.unitPrice,
            lineTotal: x.lineTotal,
            ...(x.sku ? { sku: x.sku } : {}),
            ...(x.image ? { image: x.image } : {}),
            ...(x.slug ? { slug: x.slug } : {}),
            ...(x.variant && Object.keys(x.variant).length > 0 ? { variant: x.variant } : {}),
            ...(x.selectedSize ? { selectedSize: x.selectedSize } : {}),
            ...(x.selectedVariants && Object.keys(x.selectedVariants).length > 0
                ? { selectedVariants: x.selectedVariants }
                : {}),
            ...(Array.isArray(x.selectedVariantItems) && x.selectedVariantItems.length
                ? { selectedVariantItems: x.selectedVariantItems }
                : {}),
            ...(Number(x.selectedVariantGram || 0) > 0
                ? {
                    selectedVariantGram: Number(x.selectedVariantGram || 0),
                    weightGram: Number(x.weightGram || x.selectedVariantGram || 0),
                    hasGram: Number(x.hasGram || x.selectedVariantGram || 0),
                }
                : {}),
        }));
        const subtotalTry = safeOrderItems.reduce((sum, it) => sum + toNum(it.lineTotal.amount, 0), 0);
        const shippingFeeTry = Math.max(0, toNum(data.shippingFeeTry, 0));
        const discountTry = Math.max(0, quoteDiscountTry || toNum(data.discountTry, 0));
        const totalTry = Math.max(0, subtotalTry + shippingFeeTry + serviceTotalTry - discountTry);
        const nowIso = new Date().toISOString();
        const orderRef = db.collection("orders").doc();
        const transferRef = `SIP-${orderRef.id}`;
        const orderPayload = {
            uid,
            email: email || "",
            status: "pending_payment",
            paymentStatus: "pending",
            stockApplied: reserveStockNow,
            ...(reserveStockNow ? { stockAppliedAt: firestore_1.FieldValue.serverTimestamp() } : {}),
            items: safeOrderItems,
            subtotal: money(subtotalTry),
            shippingFee: money(shippingFeeTry),
            discount: money(discountTry),
            total: money(totalTry),
            serviceTotal: money(serviceTotalTry),
            serviceTotalTry,
            clientQuote: deepClean(clientQuote),
            selectedServices: giftInfo.selectedServices,
            giftPackage: giftInfo.giftEnabled,
            giftWrap: giftInfo.giftEnabled,
            giftNote: giftInfo.giftNote || "",
            giftMessage: giftInfo.giftNote || "",
            giftPackageNote: giftInfo.giftNote || "",
            packaging: {
                gift: giftInfo.giftEnabled,
                giftPackage: giftInfo.giftEnabled,
                giftWrap: giftInfo.giftEnabled,
                note: giftInfo.giftNote || "",
                message: giftInfo.giftNote || "",
            },
            gift: {
                enabled: giftInfo.giftEnabled,
                note: giftInfo.giftNote || "",
                message: giftInfo.giftNote || "",
            },
            shippingAddress: {
                fullName: address.fullName,
                phone: address.phone,
                city: address.city,
                district: address.district,
                addressLine: address.addressLine,
                postalCode: address.postalCode || "",
                note: address.note || "",
                invoiceType: address.invoiceType || "individual",
                firstName: address.firstName || "",
                lastName: address.lastName || "",
                nationalId: address.nationalId || "",
                companyName: address.companyName || "",
                taxNumber: address.taxNumber || "",
                taxOffice: address.taxOffice || "",
            },
            billing: {
                invoiceType: address.invoiceType || "individual",
                firstName: address.firstName || "",
                lastName: address.lastName || "",
                phone: address.phone || "",
                nationalId: address.nationalId || "",
                companyName: address.companyName || "",
                taxNumber: address.taxNumber || "",
                taxOffice: address.taxOffice || "",
            },
            customer: {
                firstName: customerProfile.firstName,
                lastName: customerProfile.lastName,
                phone: customerProfile.phone,
                email: customerProfile.email,
                nationalId: customerProfile.nationalId,
                birthDate: customerProfile.birthDate,
            },
            payment: {
                provider: paymentProvider,
                method: paymentMethod,
                ...(paymentMethod === "transfer" ? { ref: transferRef } : {}),
            },
            meta: { locale, userAgent: userAgent || "" },
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            createdAtIso: nowIso,
            updatedAtIso: nowIso,
        };
        if (reserveStockNow) {
            for (const p of stockPlan) {
                tx.update(p.ref, {
                    stock: p.newStock,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
            }
        }
        tx.set(orderRef, deepClean(orderPayload));
        return {
            orderId: orderRef.id,
            totalTry,
            subtotalTry,
        };
    });
    return {
        orderId: result.orderId,
        totalTry: result.totalTry,
        subtotalTry: result.subtotalTry,
    };
});
/* ---------------- confirmOrderPaymentV1 ---------------- */
exports.confirmOrderPaymentV1 = (0, https_1.onCall)({ region: "europe-west1" }, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Login required.");
    }
    const claims = (req.auth?.token ?? {});
    const roles = Array.isArray(claims.roles) ? claims.roles.map(String) : [];
    const role = safeStr(claims.role);
    const isAdmin = claims.admin === true ||
        role === "admin" ||
        role === "sub_admin" ||
        roles.includes("admin") ||
        roles.includes("sub_admin");
    if (!isAdmin) {
        throw new https_1.HttpsError("permission-denied", "Admin only.");
    }
    const data = (req.data || {});
    const orderId = safeStr(data.orderId);
    const paymentRef = safeStr(data.paymentRef);
    if (!orderId) {
        throw new https_1.HttpsError("invalid-argument", "orderId required.");
    }
    const db = admin.firestore();
    return applyPaidOrderStockTx(db, orderId, paymentRef);
});
exports.cancelOrderAndRestoreStockV1 = (0, https_1.onCall)({ region: "europe-west1" }, async (req) => {
    console.log("[cancelOrderAndRestoreStockV1] called", {
        uid: req.auth?.uid || null,
        orderId: req.data?.orderId || null,
    });
    const uid = req.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Login required.");
    const orderId = safeStr(req.data?.orderId);
    if (!orderId) {
        throw new https_1.HttpsError("invalid-argument", "orderId required.");
    }
    const claims = (req.auth?.token ?? {});
    const isAdmin = claims.admin === true ||
        claims.roles?.includes("admin") === true;
    console.log("[cancelOrderAndRestoreStockV1] auth", {
        uid,
        isAdmin,
        claims,
    });
    if (!isAdmin) {
        throw new https_1.HttpsError("permission-denied", "Admin only.");
    }
    const db = admin.firestore();
    const orderRef = db.collection("orders").doc(orderId);
    const result = await db.runTransaction(async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists) {
            throw new https_1.HttpsError("not-found", "Order not found.");
        }
        const order = orderSnap.data();
        const paymentMethod = safeStr(order?.payment?.method).toLowerCase();
        const status = safeStr(order?.status).toLowerCase();
        console.log("[cancelOrderAndRestoreStockV1] order loaded", {
            orderId,
            status,
            paymentMethod,
            stockApplied: order.stockApplied,
            stockRestored: order.stockRestored,
            itemCount: Array.isArray(order.items) ? order.items.length : 0,
        });
        if (status === "cancelled") {
            console.log("[cancelOrderAndRestoreStockV1] already cancelled", { orderId });
            return { orderId, alreadyCancelled: true, stockReturned: false };
        }
        if (status === "paid") {
            console.log("[cancelOrderAndRestoreStockV1] blocked because paid", { orderId });
            throw new https_1.HttpsError("failed-precondition", "Paid order cannot be cancelled with stock restore.");
        }
        const shouldRestoreStock = paymentMethod === "transfer" &&
            order.stockApplied === true &&
            order.stockRestored !== true;
        console.log("[cancelOrderAndRestoreStockV1] restore decision", {
            orderId,
            shouldRestoreStock,
            paymentMethod,
            stockApplied: order.stockApplied,
            stockRestored: order.stockRestored,
        });
        const items = Array.isArray(order.items) ? order.items : [];
        if (shouldRestoreStock && items.length) {
            const prodRefs = items.map((it) => {
                const pid = safeStr(it.productId);
                if (!pid) {
                    throw new https_1.HttpsError("failed-precondition", "Invalid productId in order.");
                }
                return db.collection("products").doc(pid);
            });
            const prodSnaps = await Promise.all(prodRefs.map((r) => tx.get(r)));
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const qty = clampInt(item.qty, 1, 99);
                const psnap = prodSnaps[i];
                if (!psnap.exists)
                    continue;
                const pdata = psnap.data();
                const currentStock = Math.max(0, Math.floor(toNum(pdata?.stock, 0)));
                console.log("[cancelOrderAndRestoreStockV1] restoring item", {
                    orderId,
                    productId: item.productId,
                    qty,
                    currentStock,
                    nextStock: currentStock + qty,
                });
                tx.update(prodRefs[i], {
                    stock: currentStock + qty,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
            }
        }
        const nowIso = new Date().toISOString();
        tx.update(orderRef, {
            status: "cancelled",
            paymentStatus: "failed",
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAtIso: nowIso,
            cancelledAt: firestore_1.FieldValue.serverTimestamp(),
            cancelledAtIso: nowIso,
            ...(shouldRestoreStock
                ? {
                    stockRestored: true,
                    stockRestoredAt: firestore_1.FieldValue.serverTimestamp(),
                }
                : {}),
        });
        console.log("[cancelOrderAndRestoreStockV1] success", {
            orderId,
            finalStatus: "cancelled",
            stockReturned: shouldRestoreStock,
        });
        return {
            orderId,
            alreadyCancelled: false,
            stockReturned: shouldRestoreStock,
        };
    });
    return result;
});
exports.guestCheckoutStartV1 = (0, https_1.onCall)({ region: "europe-west1" }, async (req) => {
    try {
        const data = (req.data || {});
        const email = safeStr(data.email).toLowerCase();
        const invoiceType = safeStr(data.invoiceType) === "company" ? "company" : "individual";
        const firstName = safeStr(data.firstName);
        const lastName = safeStr(data.lastName);
        const phone = safeStr(data.phone).replace(/\D+/g, "");
        const cityId = safeStr(data.cityId);
        const cityName = safeStr(data.cityName);
        const districtId = safeStr(data.districtId);
        const districtName = safeStr(data.districtName);
        const line1 = safeStr(data.line1);
        const line2 = safeStr(data.line2);
        const postalCode = safeStr(data.postalCode).replace(/\D+/g, "");
        const nationalId = safeStr(data.nationalId).replace(/\D+/g, "");
        const companyName = safeStr(data.companyName);
        const taxNumber = safeStr(data.taxNumber).replace(/\D+/g, "");
        const taxOffice = safeStr(data.taxOffice);
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            throw new https_1.HttpsError("invalid-argument", "Valid email required.");
        }
        if (!firstName) {
            throw new https_1.HttpsError("invalid-argument", "First name required.");
        }
        if (!lastName) {
            throw new https_1.HttpsError("invalid-argument", "Last name required.");
        }
        if (!(phone.length === 10 || phone.length === 11)) {
            throw new https_1.HttpsError("invalid-argument", "Phone invalid.");
        }
        if (!cityId || !cityName) {
            throw new https_1.HttpsError("invalid-argument", "City required.");
        }
        if (!districtId || !districtName) {
            throw new https_1.HttpsError("invalid-argument", "District required.");
        }
        if (!line1) {
            throw new https_1.HttpsError("invalid-argument", "Address line required.");
        }
        if (postalCode.length !== 5) {
            throw new https_1.HttpsError("invalid-argument", "Postal code invalid.");
        }
        if (invoiceType === "individual" && nationalId && nationalId.length !== 11) {
            throw new https_1.HttpsError("invalid-argument", "National ID invalid.");
        }
        if (invoiceType === "company") {
            if (!companyName) {
                throw new https_1.HttpsError("invalid-argument", "Company name required.");
            }
            if (!(taxNumber.length === 10 || taxNumber.length === 11)) {
                throw new https_1.HttpsError("invalid-argument", "Tax number invalid.");
            }
            if (!taxOffice) {
                throw new https_1.HttpsError("invalid-argument", "Tax office required.");
            }
        }
        let userRecord = null;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
        }
        catch (err) {
            const code = String(err?.code || "");
            if (code !== "auth/user-not-found") {
                console.error("getUserByEmail failed:", err);
                throw new https_1.HttpsError("internal", "User lookup failed.");
            }
        }
        if (!userRecord) {
            const randomPassword = (0, crypto_1.randomBytes)(16).toString("hex");
            userRecord = await admin.auth().createUser({
                email,
                password: randomPassword,
                emailVerified: false,
                displayName: `${firstName} ${lastName}`.trim(),
            });
        }
        const uid = userRecord.uid;
        const db = admin.firestore();
        const userRef = db.collection("users").doc(uid);
        const addressRef = userRef.collection("addresses").doc();
        const now = firestore_1.FieldValue.serverTimestamp();
        await userRef.set(deepClean({
            firstName,
            lastName,
            phone,
            email,
            defaultAddressId: addressRef.id,
            updatedAt: now,
            createdAt: now,
        }), { merge: true });
        await addressRef.set(deepClean({
            title: "Checkout",
            invoiceType,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`.trim(),
            phone,
            nationalId: invoiceType === "individual" ? nationalId : "",
            companyName: invoiceType === "company" ? companyName : "",
            taxNumber: invoiceType === "company" ? taxNumber : "",
            taxOffice: invoiceType === "company" ? taxOffice : "",
            cityId,
            cityName,
            districtId,
            districtName,
            line1,
            line2: normalizeAddressLine(line2) === normalizeAddressLine(line1) ? "" : line2,
            postalCode,
            country: "Türkiye",
            isDefault: true,
            addressLine: normalizeAddressLine(line1, line2),
            city: cityName,
            district: districtName,
            createdAt: now,
            updatedAt: now,
        }));
        const customToken = await admin.auth().createCustomToken(uid);
        return {
            uid,
            addressId: addressRef.id,
            customToken,
        };
    }
    catch (error) {
        console.error("guestCheckoutStartV1 failed:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", safeStr(error?.message) || "Guest checkout start failed.");
    }
});
