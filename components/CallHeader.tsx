import * as React from "react";
import { useEffect, useState } from "react";

export default function CallHeader() {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prevTime: number) => prevTime + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeInSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="text-center py-4 mt-[50px] sm:mt-0">
      <div className="text-xl font-bold text-[#C3CB9C]">
        Reflecta {formatTime(elapsedTime)}
      </div>
      <div className="text-sm text-gray-500">by Jakub G.</div>
    </div>
  );
} 