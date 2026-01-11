import { Language, PlayerColor } from './types';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    title: 'LUDU',
    playGame: 'Play LUDU Game',
    startGame: 'Start Game',
    resume: 'Resume',
    restart: 'Restart Game',
    goHome: 'Go Home',
    congratulations: 'Congratulations!',
    won: 'has won the game!',
    computer: 'Computer',
    modeComputer: 'Play with Computer',
    mode2: '2 Players',
    mode3: '3 Players',
    mode4: '4 Players',
    modeTeam: 'Play with Team',
    turn: "'s Turn",
    roll: 'Roll Dice',
    settings: 'Settings',
    selectMode: 'Select Game Mode',
  },
  bn: {
    title: 'লুডু',
    playGame: 'লুডু খেলুন',
    startGame: 'খেলা শুরু করুন',
    resume: 'চালিয়ে যান',
    restart: 'আবার শুরু করুন',
    goHome: 'হোম এ যান',
    congratulations: 'অভিনন্দন!',
    won: 'খেলায় জিতেছে!',
    computer: 'কম্পিউটার',
    modeComputer: 'কম্পিউটারের সাথে খেলুন',
    mode2: '২ জন খেলোয়াড়',
    mode3: '৩ জন খেলোয়াড়',
    mode4: '৪ জন খেলোয়াড়',
    modeTeam: 'টিম নিয়ে খেলুন',
    turn: "-এর পালা",
    roll: 'ছক্কা চালুন',
    settings: 'সেটিংস',
    selectMode: 'গেম মোড নির্বাচন করুন',
  }
};

// Standard Ludo Path Coordinates (1-15 grid)
// Path starts from Red's start position (index 0) and goes clockwise
export const MAIN_PATH_COORDS: { x: number, y: number }[] = [
  // RED Start Strip (Moving Right)
  {x: 7, y: 2}, {x: 7, y: 3}, {x: 7, y: 4}, {x: 7, y: 5}, {x: 7, y: 6},
  // Up towards Green
  {x: 6, y: 7}, {x: 5, y: 7}, {x: 4, y: 7}, {x: 3, y: 7}, {x: 2, y: 7}, {x: 1, y: 7},
  // Green Turn
  {x: 1, y: 8}, {x: 1, y: 9},
  // Down from Green
  {x: 2, y: 9}, {x: 3, y: 9}, {x: 4, y: 9}, {x: 5, y: 9}, {x: 6, y: 9},
  // Right towards Yellow
  {x: 7, y: 10}, {x: 7, y: 11}, {x: 7, y: 12}, {x: 7, y: 13}, {x: 7, y: 14}, {x: 7, y: 15},
  // Yellow Turn
  {x: 8, y: 15}, {x: 9, y: 15},
  // Left from Yellow
  {x: 9, y: 14}, {x: 9, y: 13}, {x: 9, y: 12}, {x: 9, y: 11}, {x: 9, y: 10},
  // Down towards Blue
  {x: 10, y: 9}, {x: 11, y: 9}, {x: 12, y: 9}, {x: 13, y: 9}, {x: 14, y: 9}, {x: 15, y: 9},
  // Blue Turn
  {x: 15, y: 8}, {x: 15, y: 7},
  // Up from Blue
  {x: 14, y: 7}, {x: 13, y: 7}, {x: 12, y: 7}, {x: 11, y: 7}, {x: 10, y: 7},
  // Left towards Red
  {x: 9, y: 6}, {x: 9, y: 5}, {x: 9, y: 4}, {x: 9, y: 3}, {x: 9, y: 2}, {x: 9, y: 1},
  // Red Turn
  {x: 8, y: 1}, {x: 7, y: 1} // Index 51
];

// Start offsets in the MAIN_PATH_COORDS array
export const START_INDICES: Record<PlayerColor, number> = {
  [PlayerColor.RED]: 0,
  [PlayerColor.GREEN]: 13,
  [PlayerColor.YELLOW]: 26,
  [PlayerColor.BLUE]: 39
};

// Safe spots indices on the main path (0-51)
// 0 (Red Start), 8 (Globe), 13 (Green Start), 21 (Globe), 26 (Yellow Start), 34 (Globe), 39 (Blue Start), 47 (Globe)
export const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];
