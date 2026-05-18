/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Keyboard, LayoutGrid, ShieldAlert, Pause, Home } from 'lucide-react';
import { LEVELS } from './game/levels/LevelData';
import { Difficulty } from './game/types';

enum GameState {
  START,
  INTRODUCTION,
  LEVEL_SELECTION,
  PLAYING,
  PAUSED,
  GAME_OVER,
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [isPaused, setIsPaused] = useState(false);

  const startGame = (level: number = 0) => {
    setSelectedLevel(level);
    setIsPaused(false);
    setGameState(GameState.PLAYING);
    setScore(0);
  };

  const showLevelSelection = () => {
    setGameState(GameState.LEVEL_SELECTION);
  };

  const handleGameOver = (finalScore: number, reachedLevel: number) => {
    console.log('Game Over', { finalScore, reachedLevel });
    setScore(finalScore);
    setIsPaused(false);
    setMaxUnlockedLevel(prev => Math.max(prev, reachedLevel));
    setGameState(GameState.GAME_OVER);
  };

  const togglePause = () => {
    if (gameState === GameState.PLAYING) {
      setIsPaused(prev => !prev);
    }
  };

  const restartLevel = () => {
    const currentLevel = selectedLevel;
    setGameState(GameState.START); // Brief reset trigger
    setTimeout(() => {
      startGame(currentLevel);
    }, 10);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === GameState.PLAYING) {
          setIsPaused(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#E4E3E0] font-mono flex flex-col items-center justify-center p-4">
      {/* Arcade Header */}
      <div className="mb-6 text-center">
        <h1 className="text-5xl font-black tracking-tighter text-[#3366FF] drop-shadow-[0_0_10px_rgba(51,102,255,0.5)]">
          SNOW BROS ARCADE / 雪山兄弟街机
        </h1>
        <div className="text-[10px] uppercase tracking-[0.3em] opacity-50 mt-2">
          Insert Coin / 请投入硬币 • Quality Entertainment Since 1990
        </div>
      </div>

      <div className="relative group">
        {/* Decorative Grid Lines */}
        <div className="absolute -inset-4 border border-[#141414] pointer-events-none opacity-20" />
        <div className="absolute -inset-1 border border-[#141414] pointer-events-none opacity-20" />

        <AnimatePresence>
          {gameState === GameState.START && (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              className="w-[800px] h-[600px] bg-[#111] flex flex-col items-center justify-center border-4 border-gray-800 rounded-lg relative overflow-hidden"
            >
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
              <div className="text-6xl mb-8 animate-pulse text-white">❄️</div>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setGameState(GameState.INTRODUCTION)}
                  className="group relative px-12 py-4 bg-[#3366FF] hover:bg-[#2244CC] text-white font-bold text-2xl transition-all hover:scale-105 active:scale-95"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <Play size={24} fill="currentColor" />
                      HOW TO PLAY
                    </div>
                    <span className="text-xs opacity-80">玩法介绍</span>
                  </div>
                  <div className="absolute inset-0 border-2 border-white/20 translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform" />
                </button>

                <button
                  onClick={() => startGame(0)}
                  className="text-xs opacity-50 hover:opacity-100 uppercase tracking-widest font-bold flex flex-col items-center gap-1"
                >
                  <span>Skip to Game</span>
                  <span className="text-[9px]">跳至游戏</span>
                </button>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-8 text-xs opacity-70">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 border border-gray-700 rounded bg-gray-800/50">
                    <Keyboard size={20} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span>WASD / ARROWS : MOVE</span>
                    <span className="text-[9px] opacity-60">移动 & 跳跃</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 border border-gray-700 rounded bg-gray-800/50">
                    <span className="font-bold text-lg">J</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span>SPACE / J / Z / X : SNOW BREATH</span>
                    <span className="text-[9px] opacity-60">雪弹攻击</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === GameState.INTRODUCTION && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              className="w-[800px] h-[600px] bg-[#0A0A0A] border-4 border-gray-800 rounded-lg overflow-y-auto custom-scrollbar p-10 relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-[#3366FF]/20" />
              
              {/* Story Section */}
              <section className="mb-12">
                <h3 className="text-[#3366FF] text-sm font-black mb-4 tracking-[0.2em] flex items-center gap-2">
                  <span className="w-8 h-px bg-[#3366FF]/50" />
                  THE FROZEN LEGEND / 冰封传奇
                </h3>
                <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
                  <p>
                    In a world of eternal frost, the <span className="text-white font-bold italic">Snow Brothers</span>, Nick and Tom, lived in peace. But the shadows lengthened as the <span className="text-red-500 font-bold">Demon King</span> descended upon their kingdom.
                    <br/>
                    <span className="text-[11px] opacity-60 block mt-1">
                      在永恒冰霜的世界里，雪山兄弟尼克和汤姆过着平静的生活。然而，随着大魔王的降临，阴影席卷了整个王国。
                    </span>
                  </p>
                  <p>
                    The King kidnapped the Princess and cast a dark spell, transforming the twins into living snowmen. Now, with hearts of ice and breath of winter, they must embark on a journey across 5 perilous stages to reclaim their humanity.
                    <br/>
                    <span className="text-[11px] opacity-60 block mt-1">
                      魔王绑架了公主并施放了黑暗咒语，将双胞胎变成了活着的雪人。现在，带着冰冷的内心和冬之吐息，他们必须跨越 5 个险恶的关卡来夺回人类之身。
                    </span>
                  </p>
                </div>
              </section>

              {/* Mechanics Section */}
              <section className="mb-12 grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[#3366FF] text-sm font-black mb-4 tracking-[0.2em] flex items-center gap-2">
                    <span className="w-8 h-px bg-[#3366FF]/50" />
                    BATTLE TACTICS / 战斗策略
                  </h3>
                  <ul className="space-y-4 text-xs">
                    <li className="flex gap-4">
                      <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/50">❄️</div>
                      <div className="text-gray-400">
                        <span className="text-white font-bold">SNOW BREATH / 雪弹:</span> 
                        <p>Encase enemies in snow. Hit them repeatedly to form a giant snowball.</p>
                        <p className="text-[10px] opacity-60">将敌人封入雪中。多次击打以形成巨大的雪球。</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/50">💥</div>
                      <div className="text-gray-400">
                        <span className="text-white font-bold">KICK & ROLL / 踢击滚动:</span> 
                        <p>Once fully covered, kick the snowball! It will roll and crush any other enemies it touches.</p>
                        <p className="text-[10px] opacity-60">完全覆盖后，踢出雪球！它将滚动并碾压接触到的任何其他敌人。</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center shrink-0 border border-yellow-500/50">🥊</div>
                      <div className="text-gray-400">
                        <span className="text-white font-bold">ARCADE PUNCH / 拳击:</span> 
                        <p>Use your gloves to destroy rolling balls or stun threats in close quarters.</p>
                        <p className="text-[10px] opacity-60">使用手套摧毁滚动的雪球，或在近距离眩晕威胁。</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[#3366FF] text-sm font-black mb-4 tracking-[0.2em] flex items-center gap-2">
                    <span className="w-8 h-px bg-[#3366FF]/50" />
                    POWER-UP FRUITS / 加成道具
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border border-gray-800 bg-gray-900/50 rounded flex flex-col gap-1">
                      <span className="text-blue-400 font-bold text-[10px]">BLUE BERRY / 蓝莓</span>
                      <span className="text-[9px] text-gray-500 uppercase">Speed Boost (10s) / 极速</span>
                    </div>
                    <div className="p-3 border border-gray-800 bg-gray-900/50 rounded flex flex-col gap-1">
                      <span className="text-yellow-400 font-bold text-[10px]">LEMON / 柠檬</span>
                      <span className="text-[9px] text-gray-500 uppercase">Invincibility (8s) / 无敌</span>
                    </div>
                    <div className="p-3 border border-gray-800 bg-gray-900/50 rounded flex flex-col gap-1">
                      <span className="text-red-400 font-bold text-[10px]">APPLE / 苹果</span>
                      <span className="text-[9px] text-gray-500 uppercase">Power Shot (10s) / 强力弹</span>
                    </div>
                    <div className="p-3 border border-gray-800 bg-gray-900/50 rounded flex flex-col gap-1">
                      <span className="text-pink-400 font-bold text-[10px]">CAKE / 蛋糕</span>
                      <span className="text-[9px] text-gray-500 uppercase">+2000 Score / 奖励分数</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Controls Section */}
              <section className="mb-12">
                <h3 className="text-[#3366FF] text-sm font-black mb-6 tracking-[0.2em] flex items-center gap-2">
                  <span className="w-8 h-px bg-[#3366FF]/50" />
                  COMMAND MODULE / 控制指令
                </h3>
                <div className="grid grid-cols-3 gap-4">
                   <div className="flex flex-col items-center p-4 border border-gray-800 bg-gray-900/30 rounded text-center">
                      <span className="text-white text-xs mb-2 p-1 border border-gray-700 w-full bg-gray-800 uppercase">WASD / ARROWS</span>
                      <span className="text-[9px] text-gray-400 font-bold">Move & Jump</span>
                      <span className="text-[9px] text-gray-600">移动 & 跳跃</span>
                   </div>
                   <div className="flex flex-col items-center p-4 border border-gray-800 bg-gray-900/30 rounded text-center">
                      <span className="text-white text-xs mb-2 p-1 border border-gray-700 w-full bg-green-900/30 uppercase">J / Z / Space</span>
                      <span className="text-[9px] text-gray-400 font-bold">Snow Breath</span>
                      <span className="text-[9px] text-gray-600">雪弹吐息</span>
                   </div>
                   <div className="flex flex-col items-center p-4 border border-gray-800 bg-gray-900/30 rounded text-center">
                      <span className="text-white text-xs mb-2 p-1 border border-gray-700 w-full bg-red-900/30 uppercase">C Key</span>
                      <span className="text-[9px] text-gray-400 font-bold">Glove Punch</span>
                      <span className="text-[9px] text-gray-600">手套拳击</span>
                   </div>
                </div>
              </section>

              <div className="flex justify-center pt-4 sticky bottom-0 bg-[#0A0A0A] pb-4">
                <button
                  onClick={showLevelSelection}
                  className="px-12 py-3 bg-[#3366FF] hover:bg-[#2244CC] text-white font-black text-lg transition-transform hover:scale-105 shadow-[0_0_30px_rgba(51,102,255,0.3)] flex flex-col items-center leading-tight"
                >
                  <span>I'M READY TO FIGHT!</span>
                  <span className="text-xs opacity-70">我准备好战斗了！</span>
                </button>
              </div>
            </motion.div>
          )}

          {gameState === GameState.LEVEL_SELECTION && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-[800px] h-[600px] bg-[#111] flex flex-col items-center justify-center border-4 border-gray-800 rounded-lg p-8"
            >
              <h2 className="text-4xl font-black mb-12 text-[#3366FF] tracking-widest italic flex items-center gap-4">
                <LayoutGrid size={32} />
                <div className="flex flex-col items-start leading-tight">
                  <span>CHOOSE YOUR STAGE</span>
                  <span className="text-base font-bold opacity-60">选择关卡</span>
                </div>
              </h2>

              <div className="flex gap-4 mb-8">
                {(Object.keys(Difficulty) as Array<keyof typeof Difficulty>).map((key) => {
                  const d = Difficulty[key];
                  const isActive = difficulty === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-4 py-1.5 text-[10px] font-black border-2 transition-all ${
                        isActive 
                          ? 'bg-[#3366FF] border-[#3366FF] text-white shadow-[0_0_15px_rgba(51,102,255,0.4)]' 
                          : 'border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-4 gap-6 w-full px-12">
                {LEVELS.map((_, lvl) => {
                  const isLocked = lvl > maxUnlockedLevel;
                  return (
                    <button
                      key={lvl}
                      disabled={isLocked}
                      onClick={() => startGame(lvl)}
                      className={`
                        relative group aspect-square border-2 flex flex-col items-center justify-center transition-all duration-300
                        ${isLocked 
                          ? 'border-gray-800 opacity-20 cursor-not-allowed grayscale' 
                          : 'border-white/10 bg-gray-900/40 hover:border-[#3366FF] hover:bg-[#3366FF]/20 hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(51,102,255,0)] hover:shadow-[0_0_20px_rgba(51,102,255,0.3)]'
                        }
                      `}
                    >
                      <div className={`text-4xl font-black mb-1 ${isLocked ? 'text-gray-600' : 'text-white group-hover:text-[#3366FF]'}`}>
                        {lvl + 1}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Stage</div>
                      
                      {!isLocked && (
                         <div className="absolute top-2 right-2 flex gap-1">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                         </div>
                      )}
                      
                      {/* Decorative corner accents */}
                      {!isLocked && (
                        <>
                          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#3366FF]/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#3366FF]/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setGameState(GameState.START)}
                className="mt-16 text-xs opacity-50 hover:opacity-100 flex items-center gap-2 group"
              >
                <RotateCcw size={12} className="group-hover:rotate-[-45deg] transition-transform" />
                <div className="flex flex-col items-start">
                  <span>BACK TO TITLE</span>
                  <span className="text-[9px]">返回标题</span>
                </div>
              </button>
            </motion.div>
          )}

          {gameState === GameState.PLAYING && (
            <motion.div
              key={`playing-${selectedLevel}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <GameCanvas onGameOver={handleGameOver} startLevel={selectedLevel} difficulty={difficulty} isPaused={isPaused} />
              
              {/* Overlay Toggle Button */}
              <button 
                onClick={togglePause}
                className="absolute top-4 right-4 bg-gray-900/50 hover:bg-gray-800 p-2 border border-gray-700 rounded-sm z-50 text-white transition-all active:scale-95"
                title="Pause (Esc)"
              >
                {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
              </button>

              <AnimatePresence>
                {isPaused && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[100] flex flex-col items-center justify-center border-4 border-gray-800 rounded-lg pointer-events-auto"
                  >
                    <h3 className="text-4xl font-black text-[#3366FF] mb-8 italic tracking-tighter flex flex-col items-center">
                      <span>GAME PAUSED</span>
                      <span className="text-xl mt-1 tracking-normal font-bold opacity-80">游戏暂停</span>
                    </h3>
                    
                    <div className="flex flex-col gap-4 w-64">
                      <button
                        onClick={() => setIsPaused(false)}
                        className="group flex flex-col items-center bg-white text-black py-2 px-6 font-bold hover:invert transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Play size={18} fill="currentColor" />
                          <span>RESUME</span>
                        </div>
                        <span className="text-[10px] opacity-70">继续游戏</span>
                      </button>

                      <button
                        onClick={restartLevel}
                        className="group flex flex-col items-center bg-gray-800 text-white py-2 px-6 font-bold border border-gray-600 hover:bg-gray-700 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <RotateCcw size={18} />
                          <span>RESTART</span>
                        </div>
                        <span className="text-[10px] opacity-70">重新开始</span>
                      </button>

                      <button
                        onClick={showLevelSelection}
                        className="group flex flex-col items-center bg-blue-900/50 text-white py-2 px-6 font-bold border border-blue-500 hover:bg-blue-800 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <LayoutGrid size={18} />
                          <span>STAGES</span>
                        </div>
                        <span className="text-[10px] opacity-70">选择关卡</span>
                      </button>

                      <button
                        onClick={() => setGameState(GameState.START)}
                        className="group flex flex-col items-center bg-transparent text-gray-400 py-2 px-6 font-bold hover:text-white transition-all text-sm mt-4"
                      >
                        <div className="flex items-center gap-2">
                          <Home size={16} />
                          <span>MAIN MENU</span>
                        </div>
                        <span className="text-[9px] opacity-70">返回主菜单</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {gameState === GameState.GAME_OVER && (
            <motion.div
              key="over"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-[800px] h-[600px] bg-[#111] flex flex-col items-center justify-center border-4 border-gray-800 rounded-lg text-center"
            >
              <h2 className="text-7xl font-black text-red-500 mb-4 italic flex flex-col items-center">
                <span>GAME OVER</span>
                <span className="text-2xl mt-2">游戏结束</span>
              </h2>
              <div className="flex items-center gap-4 text-3xl mb-12">
                <Trophy size={32} className="text-yellow-500" />
                <div className="flex flex-col items-start">
                  <span>FINAL SCORE: {score.toString().padStart(6, '0')}</span>
                  <span className="text-sm opacity-50">最终得分</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(0)}
                  className="flex flex-col items-center gap-0 px-8 py-2 bg-white text-black font-bold rounded-sm hover:invert transition-all"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw size={18} />
                    <span>RESTART</span>
                  </div>
                  <span className="text-[10px]">重新开始</span>
                </button>
                <button
                  onClick={showLevelSelection}
                  className="flex flex-col items-center gap-0 px-8 py-2 bg-[#3366FF] text-white font-bold rounded-sm hover:bg-[#2244CC] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Play size={18} />
                    <span>LEVEL SELECT</span>
                  </div>
                  <span className="text-[10px]">选择关卡</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex gap-12 text-[10px] opacity-40 uppercase tracking-widest">
        <span>CREDIT / 积分: 00</span>
        <span className="text-green-500">SYSTEM / 系统: ONLINE / 在线</span>
        <span>LEVEL / 关卡: 01-01</span>
      </div>
    </div>
  );
}

