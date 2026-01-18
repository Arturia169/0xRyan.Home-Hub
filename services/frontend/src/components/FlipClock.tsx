import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlipClockProps {
    className?: string;
}

const FlipDigit: React.FC<{ value: string; prev: string }> = ({ value, prev }) => {
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
        if (value !== prev) {
            setIsFlipping(true);
            const timer = setTimeout(() => setIsFlipping(false), 600);
            return () => clearTimeout(timer);
        }
    }, [value, prev]);

    return (
        <div className="flip-digit">
            <AnimatePresence mode="wait">
                {isFlipping ? (
                    <motion.div
                        key={`flip-${value}`}
                        initial={{ rotateX: 90, opacity: 0 }}
                        animate={{ rotateX: 0, opacity: 1 }}
                        exit={{ rotateX: -90, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="digit-card"
                    >
                        {value}
                    </motion.div>
                ) : (
                    <div className="digit-card">{value}</div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const FlipClock: React.FC<FlipClockProps> = ({ className = '' }) => {
    const [time, setTime] = useState(new Date());
    const [prevTime, setPrevTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setPrevTime(time);
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, [time]);

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const prevHours = prevTime.getHours().toString().padStart(2, '0');
    const prevMinutes = prevTime.getMinutes().toString().padStart(2, '0');

    return (
        <div className={`flip-clock ${className}`}>
            <FlipDigit value={hours[0]} prev={prevHours[0]} />
            <FlipDigit value={hours[1]} prev={prevHours[1]} />
            <span className="separator">:</span>
            <FlipDigit value={minutes[0]} prev={prevMinutes[0]} />
            <FlipDigit value={minutes[1]} prev={prevMinutes[1]} />

            <style>{`
        .flip-clock {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
        }

        .flip-digit {
          position: relative;
          width: 42px;
          height: 56px;
          perspective: 200px;
        }

        .digit-card {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          box-shadow: inset 0 0 15px rgba(0, 229, 255, 0.15);
        }

        .separator {
          font-size: 32px;
          font-weight: 700;
          color: var(--neon-cyan);
          margin: 0 4px;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.3; }
        }
      `}</style>
        </div>
    );
};
