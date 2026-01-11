import React, { useState, useEffect, useRef } from 'react';
import { Player, PlayerType, GameMode, PlayerColor, Language } from './types';
import { TRANSLATIONS, SAFE_SPOTS, START_INDICES } from './constants';
import AdUnit from './components/AdUnit';
import Dice from './components/Dice';
import LudoBoard from './components/LudoBoard';

const App: React.FC = () => {
  // --- Global State ---
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [view, setView] = useState<'home' | 'game' | 'win'>('home');
  const [showModal, setShowModal] = useState(false);

  // --- Game State ---
  // Always 4 players in array. Type NONE means inactive.
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [waitingForMove, setWaitingForMove] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);

  // Refs for logic that shouldn't trigger re-renders but is needed in timeouts
  const playersRef = useRef(players);
  const turnRef = useRef(currentTurn);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    turnRef.current = currentTurn;
  }, [currentTurn]);

  // --- Initialization ---
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'en' ? 'bn' : 'en');
  const t = TRANSLATIONS[lang];

  // --- Game Setup Helpers ---
  const createPlayer = (color: PlayerColor, name: string, type: PlayerType): Player => ({
    color,
    name,
    type,
    hasFinished: false,
    tokens: [0, 1, 2, 3].map(id => ({ id, color, position: -1, isSafe: true, stepsMoved: 0 }))
  });

  const startGame = (mode: GameMode) => {
    // Standard Order: RED (0), GREEN (1), YELLOW (2), BLUE (3)
    const newPlayers = [
        createPlayer(PlayerColor.RED, 'Player 1', PlayerType.HUMAN),
        createPlayer(PlayerColor.GREEN, 'Player 2', PlayerType.HUMAN),
        createPlayer(PlayerColor.YELLOW, 'Player 3', PlayerType.HUMAN),
        createPlayer(PlayerColor.BLUE, 'Player 4', PlayerType.HUMAN)
    ];

    if (mode === GameMode.COMPUTER) {
        newPlayers[0].name = 'You';
        newPlayers[1] = createPlayer(PlayerColor.GREEN, 'CPU Green', PlayerType.COMPUTER);
        newPlayers[2] = createPlayer(PlayerColor.YELLOW, 'CPU Yellow', PlayerType.COMPUTER);
        newPlayers[3] = createPlayer(PlayerColor.BLUE, 'CPU Blue', PlayerType.COMPUTER);
    } 
    else if (mode === GameMode.TWO_PLAYER) {
        // Red vs Yellow (Classic Opposite)
        newPlayers[1] = createPlayer(PlayerColor.GREEN, '-', PlayerType.NONE); // Deactivate Green
        newPlayers[3] = createPlayer(PlayerColor.BLUE, '-', PlayerType.NONE);  // Deactivate Blue
    }
    else if (mode === GameMode.FOUR_PLAYER) {
        // All active (already set)
    }

    setPlayers(newPlayers);
    setCurrentTurn(0);
    setDiceValue(1);
    setWaitingForMove(false);
    setWinner(null);
    setView('game');
    setShowModal(false);
  };

  // --- Computer Logic Hook ---
  useEffect(() => {
    if (view !== 'game' || winner) return;

    const currentPlayer = players[currentTurn];
    if (currentPlayer && currentPlayer.type === PlayerType.COMPUTER && !isRolling && !waitingForMove) {
        // AI Turn Start: Wait a bit then roll
        const timer = setTimeout(() => {
            handleRollDice();
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [currentTurn, players, view, winner, isRolling, waitingForMove]);

  // Hook to handle AI Movement after roll
  useEffect(() => {
    if (view !== 'game' || winner) return;
    const currentPlayer = players[currentTurn];
    
    // Only if computer, waiting for move, and not rolling
    if (currentPlayer && currentPlayer.type === PlayerType.COMPUTER && waitingForMove && !isRolling) {
       const moves = getValidMoves(currentPlayer, diceValue);
       
       const timer = setTimeout(() => {
          if (moves.length > 0) {
              // Smart-ish AI: Prioritize killing or going home
              // For now, random valid move
              const randomId = moves[Math.floor(Math.random() * moves.length)];
              const tIdx = currentPlayer.tokens.findIndex(t => t.id === randomId);
              moveToken(currentTurn, tIdx, diceValue);
          } else {
              // No moves, pass turn
              passTurn();
          }
       }, 1000);
       return () => clearTimeout(timer);
    }
  }, [waitingForMove, isRolling, currentTurn, diceValue]); // Dependency on waitingForMove triggers this step

  // --- Core Game Logic ---

  const handleRollDice = () => {
    if (isRolling || waitingForMove) return;

    setIsRolling(true);
    // Visual roll duration
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceValue(roll);
      setIsRolling(false);
      
      const currentPlayer = playersRef.current[turnRef.current];
      const moves = getValidMoves(currentPlayer, roll);

      if (moves.length === 0) {
         // Auto pass if no moves (unless 6 rule? standard ludo: 6 gives roll even if cant move? 
         // usually you must move to get bonus. If no tokens out and not 6, pass.)
         // Simplified: If 6, roll again? Or only if moved?
         // Standard: If you roll 6, you get another turn. If you can't move, you still rolled a 6... 
         // but usually "Roll again" implies you take an action then roll.
         // Let's stick to: No moves = Pass turn immediately.
         setTimeout(() => passTurn(), 500);
      } else {
         setWaitingForMove(true); // Triggers AI move effect or waits for Human click
      }
    }, 500);
  };

  const getValidMoves = (player: Player, roll: number): number[] => {
    if (player.type === PlayerType.NONE) return [];
    return player.tokens
      .filter(t => {
        if (t.position === -1) return roll === 6; // Needs 6 to start
        if (t.stepsMoved === 57) return false; // Already home
        if (t.stepsMoved + roll > 57) return false; // Overshoot
        return true;
      })
      .map(t => t.id);
  };

  const moveToken = (pIdx: number, tIdx: number, roll: number) => {
     if (pIdx !== turnRef.current) return;
     
     const newPlayers = [...players];
     const player = newPlayers[pIdx];
     const token = player.tokens[tIdx];
     
     // Update Token State
     let newToken = { ...token };
     
     if (newToken.position === -1) {
         newToken.position = 0; // Relative 0
         newToken.stepsMoved = 0;
         newToken.isSafe = true;
     } else {
         newToken.stepsMoved += roll;
         newToken.position = (newToken.position + roll) % 52;
         const globalPos = (START_INDICES[newToken.color] + newToken.position) % 52;
         newToken.isSafe = SAFE_SPOTS.includes(globalPos) || newToken.stepsMoved > 50;
     }
     
     // Handle Collision (Kill)
     let hasKilled = false;
     if (!newToken.isSafe && newToken.stepsMoved <= 50) {
         const globalPos = (START_INDICES[newToken.color] + newToken.position) % 52;
         
         newPlayers.forEach((opp, oppIdx) => {
             if (oppIdx === pIdx || opp.type === PlayerType.NONE) return;
             opp.tokens.forEach((oppToken, oppTIdx) => {
                 if (oppToken.position !== -1 && oppToken.stepsMoved <= 50) {
                     const oppGlobal = (START_INDICES[opp.color] + oppToken.position) % 52;
                     if (globalPos === oppGlobal && !SAFE_SPOTS.includes(oppGlobal)) {
                         // Kill opponent
                         newPlayers[oppIdx].tokens[oppTIdx] = {
                             ...oppToken,
                             position: -1,
                             stepsMoved: 0,
                             isSafe: true
                         };
                         hasKilled = true;
                     }
                 }
             });
         });
     }

     newPlayers[pIdx].tokens[tIdx] = newToken;
     setPlayers(newPlayers);
     setWaitingForMove(false);

     // Check Win
     if (newToken.stepsMoved === 57 && newPlayers[pIdx].tokens.every(t => t.stepsMoved === 57)) {
         setWinner(newPlayers[pIdx]);
         setView('win');
         return;
     }

     // Turn Continuation Rule: Roll 6 OR Kill gives another turn
     if (roll === 6 || hasKilled || newToken.stepsMoved === 57) {
         // Stay on current turn, reset for roll
         // Note: Effect will see !waitingForMove and !isRolling and type=COMPUTER -> trigger roll
     } else {
         passTurn();
     }
  };

  const passTurn = () => {
    let next = (currentTurn + 1) % 4;
    // Find next active player
    while (players[next].type === PlayerType.NONE) {
        next = (next + 1) % 4;
    }
    setCurrentTurn(next);
    setDiceValue(1);
    setWaitingForMove(false);
  };

  // --- Rendering ---

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md p-3 sticky top-0 z-40 flex justify-between items-center">
        <div className="flex items-center gap-2" onClick={() => setView('home')}>
           <i className="fa-solid fa-dice text-3xl text-ludo-red cursor-pointer"></i>
           <h1 className="text-xl font-bold hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-blue-500">{t.title}</h1>
        </div>
        <div className="flex gap-3">
           <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <span className="font-bold text-sm">{lang === 'en' ? 'BN' : 'EN'}</span>
           </button>
           <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun text-yellow-400'}`}></i>
           </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Left Desktop Ad */}
          <div className="hidden lg:block w-[180px] bg-gray-50 dark:bg-black/20 shrink-0">
             <AdUnit type="sidebar" position="left" />
          </div>

          {/* Center Content */}
          <main className="flex-1 overflow-y-auto flex flex-col items-center p-2 md:p-4">
             
             {/* Mobile Top Ad */}
             <div className="block lg:hidden w-full mb-2 overflow-x-auto">
                <div className="min-w-[728px] flex justify-center transform scale-50 origin-top-left md:scale-75 md:origin-top sm:scale-100 sm:origin-center">
                   <AdUnit type="banner" position="top" />
                </div>
             </div>

             {/* Desktop Top Ad */}
             <div className="hidden lg:block w-full mb-4 max-w-[728px]">
                <AdUnit type="banner" position="top" />
             </div>

             {/* VIEW: HOME */}
             {view === 'home' && (
               <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md animate-fade-in text-center">
                  <div className="mb-8 relative">
                     <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full"></div>
                     <i className="fa-solid fa-chess-board text-9xl text-gray-700 dark:text-gray-200 relative drop-shadow-2xl"></i>
                  </div>
                  <h2 className="text-3xl font-extrabold mb-8">{t.playGame}</h2>
                  <button 
                    onClick={() => setShowModal(true)}
                    className="w-full py-4 px-8 bg-gradient-to-r from-ludo-red to-orange-500 text-white text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                  >
                    <i className="fa-solid fa-play"></i> {t.startGame}
                  </button>
               </div>
             )}

             {/* VIEW: GAME */}
             {view === 'game' && (
                <div className="w-full flex flex-col items-center">
                   
                   {/* Info Bar */}
                   <div className="w-full max-w-[600px] flex justify-between items-center mb-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                         {/* Player Avatar */}
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg
                            ${players[currentTurn]?.color === PlayerColor.RED ? 'bg-ludo-red' :
                              players[currentTurn]?.color === PlayerColor.GREEN ? 'bg-ludo-green' :
                              players[currentTurn]?.color === PlayerColor.YELLOW ? 'bg-ludo-yellow' : 'bg-ludo-blue'}
                         `}>
                            <i className={`fa-solid ${players[currentTurn]?.type === PlayerType.COMPUTER ? 'fa-robot' : 'fa-user'}`}></i>
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold text-sm md:text-base">{players[currentTurn]?.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t.turn}</span>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                          {isRolling && <span className="text-sm font-semibold animate-pulse text-blue-500">Rolling...</span>}
                          <Dice 
                            value={diceValue} 
                            rolling={isRolling} 
                            onRoll={handleRollDice} 
                            color={players[currentTurn]?.color}
                            disabled={waitingForMove || players[currentTurn]?.type === PlayerType.COMPUTER}
                          />
                      </div>
                   </div>

                   <LudoBoard 
                      players={players} 
                      currentTurn={currentTurn} 
                      onTokenClick={(p, t) => moveToken(p, t, diceValue)}
                      validMoves={!isRolling && waitingForMove ? getValidMoves(players[currentTurn], diceValue) : []}
                   />

                   <div className="mt-6 flex gap-4">
                       <button onClick={() => setView('home')} className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-red-100 hover:text-red-600 font-semibold transition-colors flex items-center gap-2">
                          <i className="fa-solid fa-right-from-bracket"></i> Quit
                       </button>
                   </div>
                </div>
             )}

             {/* Mobile Bottom Ad */}
             <div className="block lg:hidden w-full mt-4 overflow-hidden">
                 <div className="w-[728px] transform origin-top-left scale-[0.45] sm:scale-75 mx-auto">
                    <AdUnit type="banner" position="bottom" />
                 </div>
             </div>

              {/* Desktop Bottom Ad */}
              <div className="hidden lg:block w-full mt-auto max-w-[728px]">
                <AdUnit type="banner" position="bottom" />
             </div>

          </main>

          {/* Right Desktop Ad */}
          <div className="hidden lg:block w-[180px] bg-gray-50 dark:bg-black/20 shrink-0 border-l dark:border-gray-700">
             <AdUnit type="sidebar" position="right" />
          </div>

      </div>

      {/* Modal - Mode Selection */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{t.selectMode}</h2>
                    <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <div className="grid gap-3">
                    <button onClick={() => startGame(GameMode.COMPUTER)} className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-robot"></i>
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 dark:text-gray-100">{t.computer}</div>
                            <div className="text-xs text-gray-500">1 Player vs 3 CPU</div>
                        </div>
                    </button>

                    <button onClick={() => startGame(GameMode.TWO_PLAYER)} className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 transition-all flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-user-group"></i>
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 dark:text-gray-100">{t.mode2}</div>
                            <div className="text-xs text-gray-500">1 vs 1 (Red & Yellow)</div>
                        </div>
                    </button>

                    <button onClick={() => startGame(GameMode.FOUR_PLAYER)} className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 transition-all flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-users"></i>
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 dark:text-gray-100">{t.mode4}</div>
                            <div className="text-xs text-gray-500">4 Players Local</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Win Screen */}
      {view === 'win' && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-white p-4 animate-fade-in">
            <div className="relative mb-6">
                <i className="fa-solid fa-crown text-7xl text-yellow-400 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"></i>
                <div className="absolute -top-4 -right-4 text-4xl animate-pulse">✨</div>
                <div className="absolute -bottom-4 -left-4 text-4xl animate-pulse delay-75">✨</div>
            </div>
            
            <h1 className="text-5xl font-extrabold mb-4 text-center tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-600">{t.congratulations}</h1>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 text-center border border-white/10 shadow-2xl">
                <p className="text-2xl"><span className={`font-bold ${
                    winner?.color === PlayerColor.RED ? 'text-red-400' :
                    winner?.color === PlayerColor.GREEN ? 'text-green-400' :
                    winner?.color === PlayerColor.YELLOW ? 'text-yellow-400' : 'text-blue-400'
                }`}>{winner?.name}</span></p>
                <p className="text-gray-300 mt-2">{t.won}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button 
                    onClick={() => startGame(GameMode.COMPUTER)}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold shadow-lg hover:shadow-green-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-rotate-right"></i> {t.restart}
                </button>
                <button 
                    onClick={() => setView('home')}
                    className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold backdrop-blur-sm border border-white/10 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-house"></i> {t.goHome}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;