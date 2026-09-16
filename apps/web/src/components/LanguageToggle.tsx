"use client";

import { useEffect, useState } from "react";
import { getLocale, setLocale, type Locale } from "@/lib/i18n";

export default function LanguageToggle() {
  const [loc, setLoc] = useState<Locale>("tr");
  const isEn = loc === "en";

  useEffect(() => {
    try {
      const initial = getLocale?.() as Locale;
      setLoc(initial === "en" ? "en" : "tr");
    } catch {
      setLoc("tr");
    }

    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      const next = (ce?.detail as Locale) || "tr";
      setLoc(next === "en" ? "en" : "tr");
    };

    window.addEventListener("locale-changed", handler as EventListener);
    return () => window.removeEventListener("locale-changed", handler as EventListener);
  }, []);

  function toggle() {
    setLocale(isEn ? "tr" : "en");
  }

  return (
    <div className="langWrap" role="group" aria-label="Dil seçimi">
      <button
        type="button"
        className={`langSwitch ${isEn ? "is-en" : "is-tr"}`}
        onClick={toggle}
        aria-label={isEn ? "Türkçe’ye geç" : "English’e geç"}
        title={isEn ? "Türkçe" : "English"}
      >
        <span className="track" aria-hidden />
        <span className="knob" aria-hidden />
        <span className="txt txt-tr" aria-hidden>
          TR
        </span>
        <span className="txt txt-en" aria-hidden>
          EN
        </span>
      </button>

      <style jsx>{`
        .langWrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }

        .langSwitch {
          position: relative;
          width: 74px;
          height: 34px;
          padding: 0;
          border: 1px solid rgba(217, 255, 63, 0.16);
          border-radius: 12px;
          background: linear-gradient(145deg, #111610 0%, #090d09 100%);
          box-shadow:
            0 8px 20px rgba(0, 0, 0, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          overflow: hidden;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            transform 0.18s ease,
            background 0.18s ease;
        }

        .langSwitch:hover {
          border-color: rgba(217, 255, 63, 0.38);
          box-shadow:
            0 10px 26px rgba(217, 255, 63, 0.09),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .langSwitch:active {
          transform: translateY(1px);
        }

        .langSwitch:focus-visible {
          outline: none;
          border-color: rgba(217, 255, 63, 0.7);
          box-shadow:
            0 0 0 3px rgba(217, 255, 63, 0.12),
            0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .track {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          background:
            radial-gradient(circle at top left, rgba(217,255,63,.08), transparent 42%),
            linear-gradient(180deg, rgba(255,255,255,.025), transparent);
        }

        .knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 34px;
          height: 28px;
          border-radius: 9px;
          background: linear-gradient(135deg, #e5ff72 0%, #cfff25 100%);
          box-shadow:
            0 8px 18px rgba(217,255,63,.18),
            inset 0 1px 0 rgba(255,255,255,.5);
          transition:
            left 0.32s cubic-bezier(.22,1,.36,1),
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .langSwitch:hover .knob {
          box-shadow:
            0 9px 18px rgba(7, 22, 52, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .txt {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.03em;
          line-height: 1;
          pointer-events: none;
          transition: color 0.18s ease, opacity 0.18s ease;
        }

        .txt-tr {
          left: 11px;
          color: #10140f;
        }

        .txt-en {
          right: 10px;
          color: rgba(238,244,230,.5);
        }

        .langSwitch.is-en .knob {
          left: calc(100% - 36px);
        }

        .langSwitch.is-en .txt-tr {
          color: rgba(238,244,230,.5);
        }

        .langSwitch.is-en .txt-en {
          color: #10140f;
        }

        @media (max-width: 640px) {
          .langSwitch {
            width: 66px;
            height: 29px;
            border-radius: 10px;
          }

          .track {
            border-radius: 10px;
          }

          .knob {
            width: 30px;
            height: 23px;
            border-radius: 7px;
          }

          .langSwitch.is-en .knob {
            left: calc(100% - 32px);
          }

          .txt {
            font-size: 9px;
          }

          .txt-tr {
            left: 10px;
          }

          .txt-en {
            right: 9px;
          }
        }

        @media (max-width: 390px) {
          .langSwitch {
            width: 62px;
            height: 28px;
          }

          .knob {
            width: 28px;
            height: 22px;
          }

          .langSwitch.is-en .knob {
            left: calc(100% - 30px);
          }

          .txt {
            font-size: 9px;
          }

          .txt-tr {
            left: 9px;
          }

          .txt-en {
            right: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .langSwitch,
          .knob,
          .txt {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
