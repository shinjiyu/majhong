import { useState } from 'react'
import { GameBoard } from './components/GameBoard'

function App() {
  const [tiles] = useState([
    { value: 1, color: 'bg-red-500' },
    { value: 2, color: 'bg-blue-500' },
    { value: 3, color: 'bg-green-500' },
    // Add more tiles as needed
  ]);

  const handleTileClick = (index: number) => {
    console.log(`Clicked tile at index ${index}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Okey101 Game
        </h1>
        <GameBoard tiles={tiles} onTileClick={handleTileClick} />
      </div>
    </div>
  )
}

export default App
