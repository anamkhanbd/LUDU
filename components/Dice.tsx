import React from 'react';
import { PlayerColor } from '../types';

interface DiceProps {
  value: number;
  rolling: boolean;
  onRoll: () => void;
  color: PlayerColor;
  disabled: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, rolling, onRoll, color, disabled }) => {
  const dotMap: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  const getColorClass = (c: PlayerColor) => {
    switch(c) {
      case PlayerColor.RED: return 'bg-red-500 shadow-red-700/50';
      case PlayerColor.GREEN: return 'bg-green-500 shadow-green-700/50';
      case PlayerColor.YELLOW: return 'bg-yellow-400 shadow-yellow-600/50';
      case PlayerColor.BLUE: return 'bg-blue-500 shadow-blue-700/50';
    }
  };

  return (
    <div 
      onClick={() => !disabled && !rolling && onRoll()}
      className={`
        w-16 h-16 rounded-xl cursor-pointer transition-all duration-200
        grid grid-cols-3 grid-rows-3 gap-1 p-2 shadow-lg border-2 border-white/20
        ${getColorClass(color)}
        ${rolling ? 'dice-roll' : 'hover:scale-105'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
      `}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div 
          key={i} 
          className={`rounded-full bg-white transition-opacity duration-100 ${dotMap[value].includes(i) ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </div>
  );
};

export default Dice;