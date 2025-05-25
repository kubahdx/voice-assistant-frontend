import * as React from 'react';

interface WelcomePopupProps {
  onClose: () => void;
}

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F6F6F6] p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold text-[#59651F] mb-4">Cześć!</h2>
        <p className="text-[#59651F] mb-6">
        to jest beta wersja modelu głosowego! Może czasem nie złapać wszystkiego albo rozpoznawanie głosu chwilowo szwankować. Dzięki za wyrozumiałość i cierpliwość — pracuję nad tym, żeby wszystko działało jeszcze lepiej, a wkrótce wrzucę oficjalną, dopracowaną wersję! Mów głośno i wyraźnie ☺️
        </p>
        <button
          onClick={onClose}
          className="uppercase px-4 py-2 bg-[#C3CB9C] text-white rounded-md hover:bg-[#b0b88a] transition-colors"
        >
          Zamknij
        </button>
      </div>
    </div>
  );
} 