
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-red-600 border-b-8 border-black p-4 text-center shadow-lg">
      <h1 className="text-5xl sm:text-7xl font-bangers text-white tracking-wider" style={{ textShadow: '4px 4px 0 #000' }}>
        Gerador de HQs
      </h1>
      <p className="text-xl sm:text-2xl font-bangers text-yellow-300" style={{ textShadow: '2px 2px 0 #000' }}>
        Crie sua própria aventura épica!
      </p>
    </header>
  );
};

export default Header;
