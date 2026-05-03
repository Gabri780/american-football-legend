import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './screens/HomeScreen';
import { PlayerCreationScreen, PlayerCreationData } from './screens/PlayerCreationScreen';
import { HubScreen } from './screens/HubScreen';
import { GameResultScreen } from './screens/GameResultScreen';
import { ContractDecisionScreen } from './screens/ContractDecisionScreen';
import { WealthScreen } from './screens/WealthScreen';
import { CareerSummaryScreen } from './screens/CareerSummaryScreen';

// Engine imports
import { 
  initializeCareer, simulateNextGame, processOffseasonContracts, processOffseasonRetirement, startNextYear,
  CareerState 
} from '../src/engine/careerStep';
import { Game } from '../src/engine/game';
import { createPlayer } from '../src/engine/player';
import { loadTeams } from '../src/data/loadTeams';
import { SeededRandom } from '../src/engine/prng';

type ScreenName = 'home' | 'creation' | 'hub' | 'gameResult' | 'contract' | 'wealth' | 'summary';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [careerState, setCareerState] = useState<CareerState | null>(null);
  const [lastGameResult, setLastGameResult] = useState<{ 
    game: Game, 
    wasPlayoff: boolean 
  } | null>(null);

  const handleNewCareer = () => {
    setScreen('creation');
  };

  const handleStartCareer = (data: PlayerCreationData) => {
    const teams = loadTeams();
    // Random team assignment (uniform among 32)
    const randomTeamIndex = Math.floor(Math.random() * teams.length);
    const userTeamId = teams[randomTeamIndex].id;

    // Create player and override name
    const rng = new SeededRandom(Date.now().toString());
    const basePlayer = createPlayer({ position: data.position, tier: 'user', rng });
    basePlayer.firstName = data.firstName;
    basePlayer.lastName = data.lastName;

    const initialState = initializeCareer({
      teams,
      userPlayer: basePlayer,
      userTeamId,
      startYear: 2024,
      rngSeed: Date.now().toString()
    });

    setCareerState(initialState);
    setScreen('hub');
  };

  const handlePlayNextGame = () => {
    if (!careerState) return;

    const phaseBeforeGame = careerState.phase;
    const { state: newState, game } = simulateNextGame(careerState);
    let finalState = newState;

    // Auto-avance si offseason_contracts entra en modo trámite
    if (finalState.phase === 'offseason_contracts' && finalState.pendingContractContext === null) {
      finalState = processOffseasonContracts(finalState, null);
    }

    setCareerState(finalState);
    setLastGameResult({ 
      game, 
      wasPlayoff: phaseBeforeGame === 'playoffs' 
    });
    setScreen('gameResult');
  };

  const handleRetireDecision = (retire: boolean) => {
    if (!careerState) return;
    const newState = processOffseasonRetirement(careerState, retire);
    setCareerState(newState);
    // Stay in hub, the button will change
  };

  const handleStartNextSeason = () => {
    if (!careerState) return;
    const newState = startNextYear(careerState);
    setCareerState(newState);
  };

  const handleBack = () => {
    setScreen('home');
  };

  const handleExitToHome = () => {
    setCareerState(null);
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

      {screen === 'hub' && careerState && (
        <HubScreen
          careerState={careerState}
          onPlayNextGame={handlePlayNextGame}
          onOpenContract={() => setScreen('contract')}
          onOpenWealth={() => setScreen('wealth')}
          onRetireDecision={handleRetireDecision}
          onStartNextSeason={handleStartNextSeason}
          onViewSummary={() => setScreen('summary')}
        />
      )}

      {screen === 'gameResult' && lastGameResult && careerState && (
        <GameResultScreen
          game={lastGameResult.game}
          userPlayer={careerState.currentPlayer}
          userTeamId={careerState.currentTeamId}
          wasPlayoff={lastGameResult.wasPlayoff}
          onContinue={() => setScreen('hub')}
        />
      )}

      {screen === 'contract' && careerState && (
        <ContractDecisionScreen
          careerState={careerState}
          allTeams={careerState.currentTeams}
          userTeam={careerState.currentTeams.find(t => t.id === careerState.currentTeamId)}
          onUpdateState={(newState) => {
            setCareerState(newState);
            setScreen('hub');
          }}
        />
      )}

      {screen === 'wealth' && careerState && (
        <WealthScreen
          careerState={careerState}
          onUpdateState={(newState) => {
            setCareerState(newState);
            setScreen('hub');
          }}
        />
      )}

      {screen === 'summary' && careerState && (
        <CareerSummaryScreen
          careerState={careerState}
          onExit={handleExitToHome}
        />
      )}
    </SafeAreaProvider>
  );
}
