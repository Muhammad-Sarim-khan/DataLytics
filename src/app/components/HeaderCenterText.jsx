'use client';
import { Typewriter } from 'react-simple-typewriter';

export default function HeaderCenterText() {
  return (
    <span className="text-white font-bold text-2xl">
  <span className="text-yellow-100 bg-white/20 px-2 py-1 rounded font-mono">Automating:</span>{' '}
  <span className="font-mono bg-white/20 px-2 py-1 rounded text-green-100 text-2xl">
        <Typewriter
          words={['Analysis','Cleaning', 'Preprocessing']}
          loop={0}
          cursor
          cursorStyle="|"
          typeSpeed={80}
          deleteSpeed={50}
          delaySpeed={1000}
        />
      </span>
    </span>
  );
}
