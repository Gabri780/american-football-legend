import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './screens/HomeScreen';
import { PlayerCreationScreen, PlayerCreationData } from './screens/PlayerCreationScreen';

type ScreenName = 'home' | 'creation' | 'hub' | 'result' | 'summary';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home');

  const handleNewCareer = () => {
    setScreen('creation');
  };

  const handleStartCareer = (data: PlayerCreationData) => {
    console.log('Career started:', data);
    // Sub-task 3: aquí llamaremos simulateCareer y pasaremos a 'hub'
  };

  const handleBack = () => {
    setScreen('home');
  };

  return (
    <SafeAreaProvider>
      {screen === 'home' && <HomeScreen onNewCareer={handleNewCareer} />}
      {screen === 'creation' && (
        <PlayerCreationScreen 
          onStart={handleStartCareer} 
          onBack={handleBack} 
        />
      )}
    </SafeAreaProvider>
  );
}
