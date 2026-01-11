import React from 'react';
import { Player, PlayerType, PlayerColor } from '../types';
import { MAIN_PATH_COORDS, START_INDICES, SAFE_SPOTS } from '../constants';

interface BoardProps {
  players: Player[];
  onTokenClick: (playerIndex: number, tokenIndex: number) => void;
  currentTurn: number;
  validMoves: number[];
}

const LudoBoard: React.FC<BoardProps> = ({ players, onTokenClick, currentTurn, validMoves }) => {

  // Convert Grid (1-15) to Percentages for Absolute Positioning
  const getStyle = (x: number, y: number) => ({
    top: `${(x - 1) * (100 / 15)}%`,
    left: `${(y - 1) * (100 / 15)}%`,
    width: `${100 / 15}%`,
    height: `${100 / 15}%`,
  });

  // Calculate Token Screen Position
  const getTokenPosition = (player: Player, tokenIndex: number) => {
    const token = player.tokens[tokenIndex];
    
    // YARD POSITIONS
    if (token.position === -1) {
      const offsetMap = [
        { dx: 0, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }
      ];
      const off = offsetMap[tokenIndex];
      // Base positions for yards (approx center of 6x6 boxes)
      let baseX = 2.5, baseY = 2.5; // Red
      if (player.color === PlayerColor.GREEN) { baseX = 2.5; baseY = 11.5; }
      if (player.color === PlayerColor.YELLOW) { baseX = 11.5; baseY = 11.5; }
      if (player.color === PlayerColor.BLUE) { baseX = 11.5; baseY = 2.5; }
      
      // Spread them out in the white box
      return getStyle(baseX + off.dx * 1.5, baseY + off.dy * 1.5);
    }

    // HOME BASE POSITIONS (Winner Triangle)
    if (token.stepsMoved === 57) {
       // Center them in the triangle
       let hx = 8, hy = 8; // Center
       // Slight offsets to not stack perfectly
       const offsets = [{x:-0.3, y:-0.3}, {x:0.3, y:-0.3}, {x:-0.3, y:0.3}, {x:0.3, y:0.3}];
       return getStyle(hx + offsets[tokenIndex].x, hy + offsets[tokenIndex].y);
    }

    // HOME PATH
    if (token.stepsMoved > 50) {
       const stepsIn = token.stepsMoved - 51; // 1-5
       let hx = 0, hy = 0;
       if (player.color === PlayerColor.RED) { hx = 7; hy = 1 + stepsIn; }
       if (player.color === PlayerColor.GREEN) { hx = 1 + stepsIn; hy = 8; } // Down
       if (player.color === PlayerColor.YELLOW) { hx = 9; hy = 15 - stepsIn; } // Left
       if (player.color === PlayerColor.BLUE) { hx = 15 - stepsIn; hy = 8; } // Up
       return getStyle(hx, hy);
    }

    // MAIN PATH
    const globalIdx = (START_INDICES[player.color] + token.position) % 52;
    const coord = MAIN_PATH_COORDS[globalIdx];
    return getStyle(coord.x, coord.y);
  };

  // Render Grid Background (The Board Design)
  const renderBoardBackground = () => {
    const cells = [];
    // Generate 15x15 grid
    for(let r=1; r<=15; r++) {
      for(let c=1; c<=15; c++) {
        // Skip Yards and Center
        if ((r<=6 && c<=6) || (r<=6 && c>=10) || (r>=10 && c<=6) || (r>=10 && c>=10) || (r>=7 && r<=9 && c>=7 && c<=9)) {
          continue;
        }

        let bgClass = "bg-white dark:bg-slate-700 border-[0.5px] border-gray-400";
        let content = null;

        // --- HOME COLUMNS ---
        if (r===8 && c>1 && c<7) bgClass = "bg-ludo-red";
        if (c===8 && r>1 && r<7) bgClass = "bg-ludo-green";
        if (r===8 && c>9 && c<14) bgClass = "bg-ludo-yellow";
        if (c===8 && r>9 && r<14) bgClass = "bg-ludo-blue";

        // --- START ARROWS (Colored Squares) ---
        if (r===7 && c===2) { bgClass = "bg-ludo-red"; content = <i className="fa-solid fa-arrow-right text-white text-[10px] md:text-sm"></i>; }
        if (r===2 && c===9) { bgClass = "bg-ludo-green"; content = <i className="fa-solid fa-arrow-down text-white text-[10px] md:text-sm"></i>; }
        if (r===9 && c===14) { bgClass = "bg-ludo-yellow"; content = <i className="fa-solid fa-arrow-left text-white text-[10px] md:text-sm"></i>; }
        if (r===14 && c===7) { bgClass = "bg-ludo-blue"; content = <i className="fa-solid fa-arrow-up text-white text-[10px] md:text-sm"></i>; }

        // --- SAFE SPOTS (Stars) ---
        // Reverse check coords
        const pIdx = MAIN_PATH_COORDS.findIndex(p => p.x === r && p.y === c);
        if (pIdx !== -1 && SAFE_SPOTS.includes(pIdx)) {
           // Don't overwrite colored starts
           if (!bgClass.includes('bg-ludo')) {
              bgClass = "bg-gray-200 dark:bg-slate-600";
              content = <i className="fa-regular fa-star text-gray-400"></i>;
           }
        }

        cells.push(
          <div key={`bg-${r}-${c}`} className={`absolute flex items-center justify-center ${bgClass}`} style={getStyle(r, c)}>
            {content}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="w-full max-w-[600px] aspect-square bg-white dark:bg-slate-800 shadow-2xl rounded-sm relative select-none">
      
      {/* 1. Yards (Static) */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-ludo-red p-[10%] border border-gray-400">
        <div className="w-full h-full bg-white rounded-xl shadow-inner"></div>
      </div>
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-ludo-green p-[10%] border border-gray-400">
        <div className="w-full h-full bg-white rounded-xl shadow-inner"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-ludo-yellow p-[10%] border border-gray-400">
         <div className="w-full h-full bg-white rounded-xl shadow-inner"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-ludo-blue p-[10%] border border-gray-400">
        <div className="w-full h-full bg-white rounded-xl shadow-inner"></div>
      </div>

      {/* 2. Path Grid */}
      {renderBoardBackground()}

      {/* 3. Center Home */}
      <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%]">
          <div className="absolute w-full h-full overflow-hidden bg-white">
             <div className="absolute top-0 left-0 w-full h-full bg-ludo-red" style={{clipPath: 'polygon(0 0, 0 100%, 50% 50%)'}}></div>
             <div className="absolute top-0 left-0 w-full h-full bg-ludo-green" style={{clipPath: 'polygon(0 0, 100% 0, 50% 50%)'}}></div>
             <div className="absolute top-0 left-0 w-full h-full bg-ludo-yellow" style={{clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)'}}></div>
             <div className="absolute top-0 left-0 w-full h-full bg-ludo-blue" style={{clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)'}}></div>
          </div>
      </div>

      {/* 4. Tokens Layer (Absolute for Animation) */}
      {players.map((player, pIdx) => {
        if (player.type === PlayerType.NONE) return null;
        return player.tokens.map((token, tIdx) => {
          const style = getTokenPosition(player, tIdx);
          const isPlayable = currentTurn === pIdx && validMoves.includes(token.id);
          const isLocalPlayer = player.type === PlayerType.HUMAN;
          
          let tokenColor = '';
          switch(player.color) {
            case PlayerColor.RED: tokenColor = 'text-red-600 drop-shadow-sm shadow-red-900'; break;
            case PlayerColor.GREEN: tokenColor = 'text-green-600 drop-shadow-sm shadow-green-900'; break;
            case PlayerColor.YELLOW: tokenColor = 'text-yellow-500 drop-shadow-sm shadow-yellow-900'; break;
            case PlayerColor.BLUE: tokenColor = 'text-blue-600 drop-shadow-sm shadow-blue-900'; break;
          }

          // Adjust position slightly if multiple tokens are on the same spot
          const sameSpotTokens = players.flatMap((p, pi) => p.tokens.map((t, ti) => ({...t, pi, ti})))
             .filter(t => t.position !== -1 && t.stepsMoved < 57 && t.position === token.position && player.color === t.color && (t.pi !== pIdx || t.ti !== tIdx));
          
          // Simple offset logic for stacking: checks if any OTHER token is here. 
          // Realistically would need index in stack. 
          // For simplicity in this prompt, just z-index and slight hover
          
          return (
             <div
               key={`${pIdx}-${tIdx}`}
               className={`absolute flex items-center justify-center transition-all duration-500 ease-in-out z-20
                  ${isPlayable && isLocalPlayer ? 'cursor-pointer animate-bounce z-30' : ''}
               `}
               style={{...style}}
               onClick={() => {
                 if(isPlayable && isLocalPlayer) {
                    onTokenClick(pIdx, tIdx);
                 }
               }}
             >
                {/* Visual Token: Map Marker Style */}
                <i 
                   className={`fa-solid fa-location-dot text-2xl md:text-3xl ${tokenColor} stroke-white stroke-2`}
                   style={{
                     filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))',
                     stroke: 'white',
                     strokeWidth: '1px'
                   }}
                ></i>
                {/* Inner white dot for detail */}
                <div className="absolute top-[30%] w-[30%] h-[30%] bg-white rounded-full pointer-events-none"></div>
             </div>
          );
        });
      })}

    </div>
  );
};

export default LudoBoard;