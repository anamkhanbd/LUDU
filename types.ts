export enum PlayerColor {
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  BLUE = 'BLUE'
}

export enum PlayerType {
  HUMAN = 'HUMAN',
  COMPUTER = 'COMPUTER',
  NONE = 'NONE'
}

export enum GameMode {
  COMPUTER = 'COMPUTER',
  TWO_PLAYER = 'TWO_PLAYER',
  THREE_PLAYER = 'THREE_PLAYER',
  FOUR_PLAYER = 'FOUR_PLAYER',
  TEAM = 'TEAM'
}

export interface Token {
  id: number;
  color: PlayerColor;
  position: number; // -1 = Yard, 0-51 = Main Path, 52-56 = Home Path, 57 = Home Base
  isSafe: boolean;
  stepsMoved: number; // To track when to enter home stretch
}

export interface Player {
  color: PlayerColor;
  name: string;
  type: PlayerType;
  tokens: Token[];
  hasFinished: boolean;
}

export type Language = 'en' | 'bn';

export interface AdProps {
  type: 'banner' | 'sidebar';
  position: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export interface Coordinates {
  x: number;
  y: number;
}