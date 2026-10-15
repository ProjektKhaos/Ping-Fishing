/**
 * DownloadModal - Instructions & In-App Installation Dialog
 * Guides the user in Swedish & English on installing the game as an app or exporting the code.
 */

import React, { useState } from 'react';
import { X, Download, Smartphone, Monitor, Code, Copy, Check, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadModalProps {
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  const appUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 bg-stone-950/85 z-50 flex items-center justify-center p-4 select-none">
      <div className="max-w-xl w-full bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Download size={22} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-stone-100 uppercase tracking-wide">
                Ladda ner & Installera spelet
              </h2>
              <p className="text-xs text-stone-400 font-mono">
                Spela offline på dator, mobil eller ladda ner källkoden
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-4 text-xs md:text-sm">
          {/* Quick Install Action (PWA) */}
          {isInstallable && (
            <div className="p-4 bg-gradient-to-r from-amber-950/60 to-stone-900 border border-amber-500/50 rounded-xl flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-amber-300 text-sm">Installera med 1 klick!</div>
                <div className="text-xs text-stone-300 mt-0.5">
                  Lägg till spelet som en skrivbordsapp på datorn eller hemskärmen på mobilen.
                </div>
              </div>
              <button
                onClick={install}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer transition shrink-0"
              >
                Installera appen
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2 font-mono text-xs">
              <Check size={16} /> Spelet är redan installerat på din enhet!
            </div>
          )}

          {/* Option 1: Desktop Browser */}
          <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-200">
              <Monitor size={16} className="text-amber-400" />
              <span>1. Installera på dator (Chrome, Edge, Brave)</span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              Klicka på installationsikonen (<span className="text-amber-300 font-bold">Installera / Dator-ikonen</span>) längst till höger i webbläsarens adressfält, eller öppna menyn (tre prickar ⋮) och välj <strong>"Spara och dela" → "Installera Ping Flood Angler"</strong>. Då får du en egen skrivbordsikon och spelet startar i helskärm!
            </p>
          </div>

          {/* Option 2: Mobile (iOS / Android) */}
          <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-200">
              <Smartphone size={16} className="text-amber-400" />
              <span>2. Installera på mobil (iPhone, iPad & Android)</span>
            </div>
            <ul className="text-stone-400 text-xs space-y-1.5 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-stone-200">iPhone / iPad (Safari):</strong> Tryck på <strong>Dela-knappen</strong> (fyrkanten med pil uppåt) och välj <strong>"Lägg till på hemskärmen"</strong>.
              </li>
              <li>
                <strong className="text-stone-200">Android (Chrome):</strong> Tryck på menyn (⋮) uppe till höger och välj <strong>"Installera app"</strong> eller <strong>"Lägg till på startskärmen"</strong>.
              </li>
            </ul>
          </div>

          {/* Option 3: Ladda ner källkod (ZIP / GitHub) */}
          <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-200">
              <Code size={16} className="text-amber-400" />
              <span>3. Ladda ner hela källkoden till datorn</span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              Vill du ha alla filer lokalt på din hårddisk? I <strong>Google AI Studio Build</strong>-gränssnittet klickar du på knappen <strong>"Export" / "Download Code"</strong> eller GitHub-ikonen i menyn för att ladda ner hela projektet som en ZIP-fil.
            </p>
            <div className="bg-stone-900 p-2.5 rounded-lg font-mono text-[11px] text-amber-200/90 border border-stone-800">
              cd ping-flood-angler<br />
              npm install<br />
              npm run dev
            </div>
          </div>

          {/* Direct Link Share */}
          <div className="pt-2">
            <div className="text-[11px] text-stone-400 font-mono mb-1.5 uppercase tracking-wider">
              Direktlänk till spelet:
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="flex-1 bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs font-mono text-stone-300 focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition shrink-0"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Kopierad!' : 'Kopiera'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
