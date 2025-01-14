import React from 'react';

interface Tile {
  value: number;
  color: string;
}

interface GameBoardProps {
  tiles: Tile[];
  onTileClick?: (index: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ tiles, onTileClick }) => {
  return (
    <div className="grid grid-cols-13 gap-1 p-4 bg-gray-800 rounded-lg">
      {tiles.map((tile, index) => (
        <div
          key={index}
          onClick={() => onTileClick?.(index)}
          className={`
            w-12 h-16 
            flex items-center justify-center 
            rounded cursor-pointer 
            ${tile.color} 
            hover:opacity-80 
            transition-opacity
          `}
        >
          <span className="text-xl font-bold">{tile.value}</span>
        </div>
      ))}
    </div>
  );
}; 