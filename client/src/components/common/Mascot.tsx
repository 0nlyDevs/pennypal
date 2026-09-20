import React, { useState, useEffect, useRef } from "react";
import { useMascotStore } from "../../stores/mascotStore";
import type { MascotExpression } from "../../types/Mascot";

interface MascotProps {
  className?: string;
}

const EXPRESSION_FRAMES: Record<MascotExpression, number> = {
  idle: 7,
  success: 3,
  error: 3,
};

const Mascot: React.FC<MascotProps> = ({ className = "" }) => {
  const { expression } = useMascotStore();
  const [currentFrame, setCurrentFrame] = useState(1);
  const [prevExpression, setPrevExpression] =
    useState<MascotExpression>("idle");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const frameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (expression !== prevExpression) {
      setIsTransitioning(true);

      transitionTimeoutRef.current = setTimeout(() => {
        setPrevExpression(expression);
        setCurrentFrame(1);
        setIsTransitioning(false);
      }, 300); 
    }

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [expression, prevExpression]);

  useEffect(() => {
    const animateFrames = () => {
      const totalFrames = EXPRESSION_FRAMES[expression];

      if (currentFrame < totalFrames) {
        setCurrentFrame((prev) => prev + 1);
      } else {
        //for idle expression we are looping 3-5 times before reset
        if (expression === "idle") {
          const loopCount = 3; 
          const resetAfter = loopCount * totalFrames * 200; //approximation of animation duration

          setTimeout(() => {
            setCurrentFrame(1);
          }, resetAfter);
        } else {
          setTimeout(() => {
            useMascotStore.getState().resetExpression();
          }, 1000);
        }
      }
    };

    const frameDelay = expression === "idle" ? 3000 : 2000;

    frameTimeoutRef.current = setTimeout(animateFrames, frameDelay);

    return () => {
      if (frameTimeoutRef.current) {
        clearTimeout(frameTimeoutRef.current);
      }
    };
  }, [currentFrame, expression]);

  const getImageSrc = () => {
    return `/mascot/${expression}${currentFrame}.gif`;
  };

  return (
    <div className={`fixed bottom-7 right-2 z-[10000] ${className}`}>
      <div
        className={`
        transition-opacity duration-300
        ${isTransitioning ? "opacity-0" : "opacity-100"}
      `}
      >
        <img
          src={getImageSrc()}
          alt="Bear mascot"
          className="w-32 h-32 object-contain"
        />
      </div>
    </div>
  );
};

export default Mascot;