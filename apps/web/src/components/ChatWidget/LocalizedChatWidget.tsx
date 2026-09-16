"use client";

import { useLocale } from "@/lib/useT";
import ChatWidget from "./ChatWidget";

export default function LocalizedChatWidget() {
  const loc = useLocale();
  return <ChatWidget loc={loc} />;
}
