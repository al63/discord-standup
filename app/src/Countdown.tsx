import { useEffect, useRef, useState } from "react";

const COUNTDOWN_DURATION = 5;

export function Countdown({onCountdownComplete}: {onCountdownComplete: () => void}) {
    const countdownInterval = useRef<number | null>(null);
    const [countdown, setCountdown] = useState<number>(COUNTDOWN_DURATION);

    useEffect(() => {
      countdownInterval.current = setInterval(() => {
        const remainingTime = countdown - 1;
        if (remainingTime <= 0) {
          if (countdownInterval.current != null) {
            clearInterval(countdownInterval.current);
          }
          onCountdownComplete();
        } else {
          setCountdown(remainingTime);
        }
      }, 1000);

      return () => {
        if (countdownInterval.current != null) {
      clearInterval(countdownInterval.current);
    }
    }}, [countdown, onCountdownComplete]);

    return (
      <div className="countdownScreen">
          <h1>Starting in</h1>
          <div className="countdownScreen__countdown">{countdown}</div>
      </div>
    )
}
