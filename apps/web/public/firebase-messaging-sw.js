/* global importScripts, firebase */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({

  apiKey: "AIzaSyAgnFYGaJ0pp20OgV81-e8u87Tv3ojboy4",

  authDomain: "pazar-16c7b.firebaseapp.com",

  projectId: "pazar-16c7b",

  messagingSenderId: "254297328162",

  appId: "1:254297328162:web:940ea74d22603ebd5e587b",

});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "PAZAR.";
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
