export type Y = number;
export type X = number;
export type GameSize = { w: number; h: number };
export type Position = { x: X; y: Y };

export type Id = string;
export type Health = number;
type Bot = {
  id: Id;
  name?: string;
  position: Position;
  health: Health;
  viewDir: Dir;
};
export type Attacker = Bot & {};

// 0 - is 12 o'clock
export const dir = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
export type Dir = typeof dir[number];
export type Defender = Bot & {};

export type Move = {
  type: "move";
  dir: Dir;
};

export type Rotate = {
  type: "rotate";
  dir: Dir;
};

export type Shoot = {
  type: "shoot";
};

export type Nothing = {
  type: "nothing";
};

export type Action = Move | Rotate | Shoot | Nothing | undefined;
