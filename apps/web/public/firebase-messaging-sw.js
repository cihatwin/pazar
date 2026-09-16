/* global importScripts, firebase */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({

  apiKey: "AIzaSyDakvXlO6zHW9qEuUU9j6MYHpsHJ3Vp9LM",

  authDomain: "altincinew.firebaseapp.com",

  projectId: "altincinew",

  messagingSenderId: "1092460462944",

  appId: "1:1092460462944:web:e2e347ab246bf141789405",

});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "6’ncı Kuyumculuk";
  const body = payload?.notification?.body || "Yeni bildirimin var.";
  const image = payload?.notification?.image;
  const url = payload?.data?.url || "/";

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    image,
    data: { url },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});