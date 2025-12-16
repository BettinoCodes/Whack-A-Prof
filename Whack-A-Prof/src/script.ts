// --- Type Definitions ---

interface GameConfig {
  availableTime: number;
  height: number;
  width: number;
  characterDuration: number;
  spawnIntervalMin: number;
  spawnIntervalMax: number;
  API_URL: string;
  MAX_HIGH_SCORES: number;
  trusteeProbability: number;
  trusteePoints: number;
  explosionDuration: number;
  assets: {
    bloodImg: string;
    boomImg: string;
    screamSound: string;
  };
}

interface HighScore {
  name: string;
  score: number;
}

interface APIResponse {
  success: boolean;
  scores?: HighScore[];
  score?: HighScore;
  error?: string;
}

interface UIElements {
  mainMenu: HTMLElement | null;
  gameplay: HTMLElement | null;
  tutorial: HTMLElement | null;
  highScores: HTMLElement | null;
  highScoresList: HTMLElement | null;
  weaponSelector: HTMLElement | null;
  gameBoard: HTMLElement | null;
  scoreDisplay: HTMLElement | null;
  timerDisplay: HTMLElement | null;
  endGameCard: HTMLElement | null;
  endGameScore: HTMLElement | null;
  holes: HTMLDivElement[];
  playButton: HTMLElement | null;
  tutorialButton: HTMLElement | null;
  leaderboardButton: HTMLElement | null;
  backButtons: NodeListOf<Element>;
  startGameButton: HTMLElement | null;
  pauseButton: HTMLElement | null;
  closeEndCardButton: HTMLElement | null;
  weapon1Btn: HTMLElement | null;
  weapon2Btn: HTMLElement | null;
  cursor: HTMLElement | null;
  gameplayscreen: HTMLElement | null;
  Punch: string;
  miss: string;
  go: string;
  originalSrc: string;
  whackedSrc: string;
  trusteeOriginalSrc: string;
  trusteeWhackedSrc: string;
  playerNameInput?: HTMLInputElement | null;
  saveScoreButton?: HTMLElement | null;
}

type ScreenName = 'mainMenu' | 'gameplay' | 'tutorial' | 'highScores' | 'weaponSelector';
type ButtonName = 'start' | 'pause';

interface UIModule {
  elements: UIElements;
  game: Game | null;
  init(gameInstance: Game): void;
  setupEventListeners(): void;
  hideAllScreens(): void;
  showScreen(screenName: ScreenName): void;
  scaleBoard(): void;
  createHoles(rows: number, cols: number): void;
  showMole(index: number, isTrustee?: boolean): void;
  hideMole(index: number): void;
  clearAllMoles(): void;
  updateScoreDisplay(score: number): void;
  updateTimerDisplay(timeLeft: number, isPaused: boolean): void;
  displayEndGame(finalScore: number): void;
  hideEndGame(): void;
  setButtonState(buttonName: ButtonName, text: string, disabled?: boolean): void;
  displayHighScores(): Promise<void>;
}

interface GameElements {
  bloodOverlay: HTMLDivElement | null;
  bloodImg?: HTMLImageElement | null;
}

// --- Configuration ---
const config: GameConfig = {
  availableTime: 30, // seconds
  height: 4,
  width: 4,
  characterDuration: 2000, // ms
  spawnIntervalMin: 500, // ms
  spawnIntervalMax: 1500, // ms
  API_URL: '/api/scores', // API endpoint for high scores
  MAX_HIGH_SCORES: 10, // Limit leaderboard to top 10
  
  // Trustee configuration
  trusteeProbability: 0.05, // 5% probability for trustee appearance
  trusteePoints: 20, // Points awarded for hitting a trustee
  explosionDuration: 250, // Duration of explosion animation in ms
  
  // Asset paths centralized here
  assets: {
    bloodImg: '/assets/Animation/blood.png',
    boomImg: '/assets/final/Boom.png',
    screamSound: '/assets/Animation/wilhelm-scream.wav'
  }
};


// -- API for Scores
/**
 * Retrieves high scores from the PostgreSQL database via API.
 * @returns A promise that resolves to an array of high score objects.
 * @example
 * const highScores = await getHighScores();
 * // highScores = [{name: "Player1", score: 1000}, {name: "Player2", score: 900}]
 */
async function getHighScores(): Promise<HighScore[]> {
    try {
        const response = await fetch(config.API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: APIResponse = await response.json();
        if (data.success && data.scores) {
            return data.scores;
        }
        return [];
    } catch (error) {
        console.error("Error fetching high scores from API:", error);
        return [];
    }
}


// -- Save High Score
/**
 * Saves a new high score to the PostgreSQL database via API.
 * @param newScore - The new score to save.
 * @param playerName - The name of the player who achieved the score.
 * @example
 * await saveHighScore(1500, "Player1");
 */
async function saveHighScore(newScore: number, playerName: string = "Anonymous"): Promise<void> {
    if (typeof newScore !== 'number' || isNaN(newScore) || newScore <= 0) {
        return;
    }

    try {
        const response = await fetch(config.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: playerName,
                score: newScore
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: APIResponse = await response.json();
        if (data.success) {
            console.log("High score saved:", data.score);
        } else {
            console.error("Failed to save high score:", data.error);
        }
    } catch (error) {
        console.error("Error saving high score to API:", error);
    }
}


// --- UI Module ---
const UI: UIModule = {
  // DOM Elements
  elements: {
      mainMenu: document.getElementById('main-menu'),
      gameplay: document.getElementById('gameplay'),
      tutorial: document.getElementById('tutorial'),
      highScores: document.getElementById('high-scores'),
      highScoresList: document.getElementById('score-list'),
      weaponSelector: document.getElementById('weapon-selection'),

      gameBoard: document.getElementById('game'),
      scoreDisplay: document.getElementById('score'),
      timerDisplay: document.getElementById('timer'),
      endGameCard: document.getElementById('end-game-card'),
      endGameScore: null, // Will be created dynamically or assign if exists
      holes: [], // Will be populated
      playButton: document.getElementById('play-button'),
      tutorialButton: document.getElementById('tutorial-button'),
      leaderboardButton: document.getElementById('leaderboard-button'),
      backButtons: document.querySelectorAll('.back-button'),
      startGameButton: document.querySelector('.start-game-button'), // Assuming one start button in gameplay
      pauseButton: document.querySelector('.pause-button'), // Assuming one pause button
      closeEndCardButton: null, // Will find/create later
      weapon1Btn: document.getElementById('weapon1'),
      weapon2Btn: document.getElementById('weapon2'),
      cursor: document.getElementById('custom-cursor'),
      gameplayscreen: document.getElementById('game-play'),

      // Sounds
      Punch: '/assets/Animation/Punchsound.mp3',
      miss: '/assets/Animation/Misssound.mp3',
      go: '/assets/Animation/gosoundeffect.mp3',

      originalSrc:'/assets/Animation/prof1_1.png',
      whackedSrc:'/assets/Animation/prof1_dizzy1.png',
      trusteeOriginalSrc: '/assets/Animation/trustee.png',
      trusteeWhackedSrc: '/assets/final/Trustee_Explode_once 1.png',
  },

  game: null,

  /**
   * Initialize the UI module.
   * @param gameInstance - The game instance to associate with the UI.
   */
  init(gameInstance: Game): void {
      this.game = gameInstance; // Reference to the game logic instance
      this.setupEventListeners();
      this.scaleBoard();
      window.addEventListener('resize', this.scaleBoard.bind(this)); // Ensure 'this' is UI
      this.showScreen('mainMenu'); // Show start screen on load
      this.createHoles(config.height, config.width);
      this.updateTimerDisplay(config.availableTime, false); // Initial display
      this.updateScoreDisplay(0); // Initial display
  },


  /**
   * Wire up menu, tutorial, leaderboard, and gameplay buttons.
   */
  setupEventListeners(): void {
      this.elements.playButton?.addEventListener('click', () => this.showScreen('weaponSelector'));
      this.elements.tutorialButton?.addEventListener('click', () => this.showScreen('tutorial'));
      this.elements.leaderboardButton?.addEventListener('click', () => this.showScreen('highScores'));

      this.elements.weapon1Btn?.addEventListener("click", () => {
        document.body.classList.remove("cursor-weapon2");
        document.body.classList.add("cursor-weapon1");
        this.showScreen("gameplay");
      });

      this.elements.weapon2Btn?.addEventListener("click", () => {
        document.body.classList.remove("cursor-weapon1");
        document.body.classList.add("cursor-weapon2");
        this.showScreen("gameplay");
      });

      /**
       * Return-to-main-menu buttons.
       * Each .back-button closes the current overlay and shows the main menu.
       */
      this.elements.backButtons.forEach(button => {
          button.addEventListener('click', () => this.showScreen('mainMenu'));
      });

      this.elements.startGameButton?.addEventListener('click', () => {
          // Toggle between Start and Stop
          if (this.game?.isRunning() || this.game?.isPaused()) {
               this.game?.stop(); // Use stop for manual ending
          } else {
                const startsound = new Audio(UI.elements.go);
                startsound.play();
               this.game?.start();
          }
      });

      this.elements.pauseButton?.addEventListener('click', () => {
           this.game?.togglePause();
      });
      
      /**
       * Handle a click on a hole: award or deduct points, update score display.
       */
      this.elements.gameBoard?.addEventListener('click', (event: MouseEvent) => {
        console.log('Clicked element:', event.target); 
        if (!this.game?.isRunning() || this.game?.isPaused()) return;
          
        const clickedElement = event.target as HTMLElement;
        let hitMole = false;

        const moleImg = clickedElement.closest('.mole-img') as HTMLImageElement | null;
        const hole = clickedElement.closest('.hole') as HTMLElement | null;

        const whackSound = new Audio(UI.elements.Punch);
        const missSound = new Audio(UI.elements.miss);

        if (moleImg && hole) {
            const index = parseInt(hole.dataset.index || '', 10);
            if (!isNaN(index)) {
                moleImg.src = moleImg.dataset.whackedSrc || ''; // Change to dizzy image
                whackSound.play();
                // Handle the whack
                this.game?.handleWhack(index);
                hitMole = true;
            }
        } 
        if (!hitMole) { 
            missSound.play();
            // otherwise, register a miss or timeout and apply penalty
            this.game?.handleMiss();
        }
      });

      document.addEventListener('mousemove', (e: MouseEvent) => {
        const cursor = document.getElementById('custom-cursor');
        if (cursor) {
          cursor.style.left = `${e.pageX - 50}px`;
          cursor.style.top = `${e.pageY - 35}px`;
        }
      });

      document.addEventListener('click', () => {
        const cursor = document.getElementById('custom-cursor');
        if (cursor) {
          cursor.style.transform = 'rotate(-80deg)';
          setTimeout(() => {
            cursor.style.transform = 'rotate(0deg)';
          }, 300);
        }
      });
  },


  /**
   * Hide all primary UI overlays: main menu, tutorial, leaderboard, gameplay.
   */
  hideAllScreens(): void {
      this.elements.mainMenu?.classList.add('hidden');
      this.elements.tutorial?.classList.add('hidden');
      this.elements.highScores?.classList.add('hidden');
      this.elements.gameplay?.classList.add('hidden');
      this.elements.weaponSelector?.classList.add('hidden');
  },


  /**
   * Show the specified screen overlay and hide all others.
   * @param screenName - The name of the screen to show (e.g., 'mainMenu', 'gameplay').
   */
  showScreen(screenName: ScreenName): void {
      this.hideAllScreens();
      switch (screenName) {
          case 'mainMenu':
              this.elements.mainMenu?.classList.remove('hidden');
              break;
          case 'gameplay':
              this.elements.gameplay?.classList.remove('hidden');
              // Reset button states when showing gameplay screen initially
              if (!this.game || (!this.game.isRunning() && !this.game.isPaused())) {
                   this.setButtonState('start', 'Start Game');
                   this.setButtonState('pause', 'Pause'); // Default state
                   if (this.elements.pauseButton) {
                     (this.elements.pauseButton as HTMLButtonElement).disabled = true;
                   }
              }
              break;
          case 'tutorial':
              this.elements.tutorial?.classList.remove('hidden');
              break;
          case 'highScores':
              this.displayHighScores(); // This is now async but we don't need to await
              this.elements.highScores?.classList.remove('hidden');
              break;
          case 'weaponSelector':
              this.elements.weaponSelector?.classList.remove('hidden');
              break;
        }
  },


  /**
   * Recalculate grid hole size and gap based on viewport dimensions,
   * then update CSS variables `--hole` and `--gap`. Also resets timer display.
   */
  scaleBoard(): void {
      const maxSide = Math.min(
          window.innerWidth * 0.75,
          window.innerHeight * 0.6667
      );
      const holeSize = maxSide / Math.max(config.height + 2 * 0.25, config.width + 2 * 0.25);
      const gapSize = holeSize * 0.15;

      document.documentElement.style.setProperty('--hole', `${holeSize}px`);
      document.documentElement.style.setProperty('--gap', `${gapSize}px`);
  },


  /**
   * Build a `rows × cols` grid of clickable hole <div>s inside game.
   * @param rows - Number of grid rows.
   * @param cols - Number of grid columns.
   */
  createHoles(rows: number, cols: number): void {
    if (!this.elements.gameBoard) return;
    
    this.elements.gameBoard.innerHTML = '';
    this.elements.holes = [];
    const totalHoles = rows * cols;
    this.elements.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.elements.gameBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    for (let i = 0; i < totalHoles; i++) {
        const hole = document.createElement('div');
        hole.classList.add('hole');
        hole.dataset.index = i.toString();

        const mole = document.createElement('img');
        mole.src = '/assets/Animation/prof1_1.png';
        mole.classList.add('mole-img');
        mole.dataset.index = i.toString();
        mole.dataset.originalSrc = '/assets/Animation/prof1_1.png';
        mole.dataset.whackedSrc = '/assets/Animation/bloodyprof.png';
        mole.style.display = 'none'; 

        // Append mole to the hole
        hole.appendChild(mole);
        this.elements.gameBoard.appendChild(hole);
        this.elements.holes.push(hole);
    }
  },


  /**
   * Show a mole or trustee in the specified hole.
   * @param index - The index of the hole.
   * @param isTrustee - Whether the character is a trustee.
   */
  showMole(index: number, isTrustee: boolean = false): void {
      if (this.elements.holes[index]) {
          this.elements.holes[index].classList.add('mole');
          const mole = this.elements.holes[index].querySelector('.mole-img') as HTMLImageElement | null;
          if (mole) {
              // Set appropriate image based on character type
              mole.src = isTrustee ? this.elements.trusteeOriginalSrc : this.elements.originalSrc;
              mole.dataset.originalSrc = isTrustee ? this.elements.trusteeOriginalSrc : this.elements.originalSrc;
              mole.dataset.whackedSrc = isTrustee ? this.elements.trusteeWhackedSrc : this.elements.whackedSrc;
              
              // Store whether this is a trustee in a data attribute
              mole.dataset.isTrustee = isTrustee.toString();
              
              mole.style.display = 'block'; // Show mole
              mole.style.pointerEvents = 'auto'; // Enable pointer events
              mole.style.transform = 'translate(-50%, 0)';
              mole.style.opacity = '1'; // Move up to center
          }
      }
  },


  /**
   * Hide the mole in the specified hole.
   * @param index - The index of the hole.
   */
  hideMole(index: number): void {
      if (this.elements.holes[index]) {
          this.elements.holes[index].classList.remove('mole');
          const mole = this.elements.holes[index].querySelector('.mole-img') as HTMLImageElement | null;
          if (mole) {
              mole.style.transform = 'translate(-50%, 50%)'; // Move back down
              mole.style.pointerEvents = 'none';
              mole.style.opacity = '0'; // Hide mole
          }
      }
  },


  /**
   * Remove all moles from the board.
   */
  clearAllMoles(): void {
      this.elements.holes.forEach(hole => hole.classList.remove('mole'));
      this.elements.holes.forEach(hole => {
          const mole = hole.querySelector('.mole-img') as HTMLImageElement | null;
          if (mole) {
              mole.style.transform = 'translate(-50%, 100%)'; // Move back down
              mole.style.display = 'none';
              mole.style.pointerEvents = 'none';
          }
      });
  },


  /**
   * Update the score display in the UI.
   * @param score - The current score to display.
   */
  updateScoreDisplay(score: number): void {
      if (this.elements.scoreDisplay) {
          this.elements.scoreDisplay.textContent = `Score: ${score}`;
      }
  },


  /**
   * Update the timer display in the UI.
   * @param timeLeft - The time left in seconds.
   * @param isPaused - Whether the game is paused.
   */
  updateTimerDisplay(timeLeft: number, isPaused: boolean): void {
      if (this.elements.timerDisplay) {
          this.elements.timerDisplay.textContent = `Time Left: ${timeLeft}${isPaused ? ' (Paused)' : ''}`;
      }
  },


  /**
   * Display the end game card with the final score and name input.
   * @param finalScore - The final score to display.
   */
  displayEndGame(finalScore: number): void {
      if (!this.elements.endGameCard) return;
      
      // Ensure the card content exists or create it
      let content = this.elements.endGameCard.querySelector('.card-content');
      if (!content) {
          this.elements.endGameCard.innerHTML = `<div class="card-content">
              <h2>Game Over!</h2>
              <p>Your final score: <span class="final-score"></span></p>
              <div class="name-input-container">
                  <p>Enter your name for the high score:</p>
                  <input type="text" class="player-name-input" placeholder="Anonymous" maxlength="20">
              </div>
              <div class="end-game-buttons">
                  <button class="save-score-button">Save Score</button>
                  <button class="close-end-card-button">Close</button>
              </div>
          </div>`;
          content = this.elements.endGameCard.querySelector('.card-content');
          this.elements.endGameScore = content?.querySelector('.final-score') || null;
          this.elements.playerNameInput = content?.querySelector('.player-name-input') as HTMLInputElement | null;
          this.elements.saveScoreButton = content?.querySelector('.save-score-button') || null;
          this.elements.closeEndCardButton = content?.querySelector('.close-end-card-button') || null;
          
          // Add save score listener (async)
          this.elements.saveScoreButton?.addEventListener('click', async () => {
              const playerName = this.elements.playerNameInput?.value.trim() || "Anonymous";
              await saveHighScore(finalScore, playerName);
              // Close the popup after saving
              this.hideEndGame();
              this.game?.reset(); // Reset the game for next round
          });
          
          // Add close button listener
          this.elements.closeEndCardButton?.addEventListener('click', () => {
              this.hideEndGame();
              this.game?.reset(); // Let game handle reset logic
          });
      } else {
          // Reset the form for a new game
          if (this.elements.playerNameInput) {
              this.elements.playerNameInput.value = '';
          }
      }

      if (this.elements.endGameScore) {
          this.elements.endGameScore.textContent = finalScore.toString();
      }
      this.elements.endGameCard.style.display = 'flex';
  },


  /**
   * Hide the end game card.
   */
  hideEndGame(): void {
      if (this.elements.endGameCard) {
          this.elements.endGameCard.style.display = 'none';
      }
  },


  /**
   * Set the text and disabled state of a button.
   * @param buttonName - The name of the button ('start', 'pause', etc.).
   * @param text - The text to display on the button.
   * @param disabled - Whether the button should be disabled.
   */
  setButtonState(buttonName: ButtonName, text: string, disabled: boolean = false): void {
      let buttonElement: HTMLElement | null = null;
      switch (buttonName) {
           case 'start':
                buttonElement = this.elements.startGameButton;
                break;
           case 'pause':
                buttonElement = this.elements.pauseButton;
                break;
      }
      if (buttonElement) {
           buttonElement.textContent = text;
           (buttonElement as HTMLButtonElement).disabled = disabled;
      }
  },


  /**
   * Display the high scores list in the UI (fetched from PostgreSQL via API).
   */
  async displayHighScores(): Promise<void> {
    const listElement = this.elements.highScoresList;

    // Check if the list element was found correctly
    if (!listElement) {
        console.error("Score list element (#score-list) not found in UI.elements!");
        return;
    }

    // Show loading state
    listElement.innerHTML = '<li>Loading high scores...</li>';

    try {
        const scores = await getHighScores();

        // Clear loading state
        listElement.innerHTML = '';

        if (scores.length === 0) {
            listElement.innerHTML = '<li>No high scores yet!</li>';
        } else {
            scores.forEach((scoreObj) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${scoreObj.name}: ${scoreObj.score}`;
                listElement.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error("Error displaying high scores:", error);
        listElement.innerHTML = '<li>Error loading high scores</li>';
    }
  },
};


// --- Game Class ---
class Game {
  private ui: UIModule;
  private config: GameConfig;
  
  // --- State ---
  private score: number = 0;
  private timeLeft: number = 0;
  private activeMoles: Set<number> = new Set();
  private activeTrustees: Set<number> = new Set();
  private gameRunning: boolean = false;
  private gamePaused: boolean = false;
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;
  private spawnTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private elements: GameElements = {
    bloodOverlay: null
  };

  constructor(ui: UIModule, gameConfig: GameConfig) {
      this.ui = ui;
      this.config = gameConfig;
      this.reset(); // Initialize state
      this.createExplosionOverlay(); // Initialize explosion overlay
  }

  /**
   * Create explosion overlay for trustee whack animation.
   */
  private createExplosionOverlay(): void {
      // Create blood overlay that covers the screen
      const bloodOverlay = document.createElement('div');
      bloodOverlay.id = 'blood-overlay';
      bloodOverlay.style.position = 'fixed';
      bloodOverlay.style.top = '0';
      bloodOverlay.style.left = '0';
      bloodOverlay.style.width = '100%';
      bloodOverlay.style.height = '100%';
      bloodOverlay.style.display = 'none';
      bloodOverlay.style.zIndex = '2000';
      bloodOverlay.style.pointerEvents = 'none'; // Allow clicks to pass through
      bloodOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.2)'; // Light red tint
      
      // Create blood image without setting the src yet
      const bloodImg = document.createElement('img');
      bloodImg.style.width = '100%';
      bloodImg.style.height = '100%';
      bloodImg.style.objectFit = 'cover';
      bloodImg.style.opacity = '0.7';
      bloodImg.style.animation = 'pulse-animation 0.25s 1';
      
      // Add keyframe animation to the document if it doesn't exist
      if (!document.getElementById('blood-animation-style')) {
          const bloodAnimationStyle = document.createElement('style');
          bloodAnimationStyle.id = 'blood-animation-style';
          bloodAnimationStyle.textContent = `
              @keyframes pulse-animation {
                  0% { opacity: 0; transform: scale(0.8); }
                  50% { opacity: 0.9; transform: scale(1.05); }
                  100% { opacity: 0.7; transform: scale(1); }
              }
              
              @keyframes explode-animation {
                  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                  100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
              }
          `;
          document.head.appendChild(bloodAnimationStyle);
      }
      
      bloodOverlay.appendChild(bloodImg);
      document.body.appendChild(bloodOverlay);
      this.elements.bloodOverlay = bloodOverlay;
      this.elements.bloodImg = bloodImg;
  }

  /**
   * Show explosion animation and sound for a trustee whack.
   * @param index - The index of the hole where the explosion occurs.
   */
  private showExplosionAnimation(index: number): void {
      // Play the scream sound effect
      const screamSound = new Audio(this.config.assets.screamSound);
      screamSound.play();
      
      // Show blood overlay over the entire screen
      if (this.elements.bloodOverlay) {
          this.elements.bloodOverlay.style.display = 'block';
          
          // Hide blood overlay after the specified duration
          setTimeout(() => {
              this.hideExplosionAnimation();
          }, this.config.explosionDuration);
      }
      
      // Apply explosion effect directly on the mole/trustee
      if (index !== undefined && this.ui.elements.holes[index]) {
          const hole = this.ui.elements.holes[index];
          const moleImg = hole.querySelector('.mole-img');
          if (moleImg) {
              // Add an explosion effect directly on the character
              const explosionEffect = document.createElement('img');
              explosionEffect.src = this.config.assets.boomImg;
              explosionEffect.className = 'explosion-effect';
              explosionEffect.style.position = 'absolute';
              explosionEffect.style.width = '150%';
              explosionEffect.style.height = 'auto';
              explosionEffect.style.left = '50%';
              explosionEffect.style.top = '50%';
              explosionEffect.style.transform = 'translate(-50%, -50%)';
              explosionEffect.style.zIndex = '1500';
              explosionEffect.style.pointerEvents = 'none';
              explosionEffect.style.animation = 'explode-animation 0.25s 1';
              
              hole.appendChild(explosionEffect);
              
              // Remove the explosion effect after animation
              setTimeout(() => {
                  hole.removeChild(explosionEffect);
              }, this.config.explosionDuration);
          }
      }
  }

  /**
   * Hide the explosion animation overlay.
   */
  private hideExplosionAnimation(): void {
      if (this.elements.bloodOverlay) {
          this.elements.bloodOverlay.style.display = 'none';
      }
  }

  /**
   * Update all explosion-related resources with config paths.
   */
  public updateExplosionResources(): void {
      // Only proceed if elements are available
      if (this.elements.bloodImg) {
          // Use centralized config paths
          this.elements.bloodImg.src = this.config.assets.bloodImg;
      }
  }

  // --- Core Logic Methods ---
  /**
   * Start or stop a game round. On first call, resets state, begins spawn loop and countdown.
   * On second call (while `gameRunning`), ends the round immediately.
   */
  public start(): void {
      if (this.gameRunning) return; // Prevent multiple starts

      this.reset(); // Ensure clean state before starting
      this.gameRunning = true;
      this.gamePaused = false; // Explicitly set paused to false
      this.timeLeft = this.config.availableTime;

      this.ui.updateScoreDisplay(this.score);
      this.ui.updateTimerDisplay(this.timeLeft, this.gamePaused);
      this.ui.hideEndGame();
      this.ui.setButtonState('start', 'Stop Game');
      this.ui.setButtonState('pause', 'Pause', false); // Enable pause

      this._scheduleNextSpawn();
      this._startTimer();
  }


  /**
   * End the current game: clear timers, show the "Game Over" card, and display final score.
   */
  public stop(): void {
      if (!this.gameRunning && !this.gamePaused) return; // Do nothing if already stopped

      this.gameRunning = false;
      this.gamePaused = false; // Ensure not paused when stopped

      this._clearTimers();
      this.ui.clearAllMoles(); // Clear visuals
      this.activeMoles.clear(); // Clear internal tracking

      // Only show end game card if it wasn't a pause->stop scenario
      this.ui.displayEndGame(this.score);
      
      // The name input and score saving is now handled by the end game card UI

      // Reset button states for next game potential
      this.ui.setButtonState('start', 'Start Game');
      this.ui.setButtonState('pause', 'Pause', true); // Disable pause
  }


  /**
   * Reset all game state to initial values, clear timers, and hide game over card.
   */
  public reset(): void {
      this.score = 0;
      this.timeLeft = this.config.availableTime;
      this.activeMoles.clear();
      this.activeTrustees.clear();
      this.gameRunning = false;
      this.gamePaused = false;

      this._clearTimers();
      this.ui.clearAllMoles();
      this.ui.hideEndGame();
      this.hideExplosionAnimation(); // Ensure explosion overlay is hidden

      // Update UI to reflect reset state
      this.ui.updateScoreDisplay(this.score);
      this.ui.updateTimerDisplay(this.timeLeft, this.gamePaused);
      this.ui.setButtonState('start', 'Start Game');
      this.ui.setButtonState('pause', 'Pause', true); // Disable pause
  }


  /**
   * Toggle the paused state of the game.
   */
  public togglePause(): void {
      if (!this.gameRunning) return; // Can't pause if not running

      this.gamePaused = !this.gamePaused;

      if (this.gamePaused) {
          this._clearTimers(); // Stop game clock and spawning
          this.ui.setButtonState('pause', 'Unpause');
      } else {
          this._startTimer(); // Resume game clock
          this._scheduleNextSpawn(); // Resume spawning
          this.ui.setButtonState('pause', 'Pause');
      }
      // Update timer display regardless
      this.ui.updateTimerDisplay(this.timeLeft, this.gamePaused);
  }


  /**
   * Handle a successful click on a mole: award points, update score display.
   * @param index - The index of the hole that was whacked.
   */
  public handleWhack(index: number): void {
      // Check if this is a trustee
      if (this.activeTrustees.has(index)) {
          this.score += this.config.trusteePoints; // Award bonus points for trustee
          this.activeTrustees.delete(index);
          // Show explosion animation for trustees
          this.showExplosionAnimation(index);
      } else {
          this.score += 10; // Regular points for professor
      }
      
      this.activeMoles.delete(index);
      // Let UI handle visuals
      this.ui.updateScoreDisplay(this.score);
      this.ui.hideMole(index);
  }


  /**
   * Handle an unsuccessful click on a hole or the game board: deduct points, update score display.
   */
  public handleMiss(): void {
    this.score -= 5; // Penalty for missed whack
    if (this.score < 0) this.score = 0; // minimum score is zero
    this.ui.updateScoreDisplay(this.score);
  }


  // --- Internal Helper Methods ---
  /**
   * Decrement the game timer and update the UI.
   */
  private _tick(): void {
      if (this.gamePaused) return; // Double check just in case

      this.timeLeft--;
      this.ui.updateTimerDisplay(this.timeLeft, this.gamePaused);

      if (this.timeLeft <= 0) {
          this.stop(); // Game over due to time
      }
  }


  /**
   * Spawn a mole in a random empty hole, keep it visible for `characterDuration`,
   * then remove it. Recursively schedules the next spawn at a random interval.
   */
  private _spawnMole(): void {
      // Find available holes (indices not in activeMoles)
      const totalHoles = this.config.height * this.config.width;
      const availableHoleIndices: number[] = [];
      for (let i = 0; i < totalHoles; i++) {
          if (!this.activeMoles.has(i)) {
              availableHoleIndices.push(i);
          }
      }

      if (availableHoleIndices.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableHoleIndices.length);
          const holeIndex = availableHoleIndices[randomIndex];
          
          // Randomly decide if this should be a trustee (5-10% chance)
          const isTrustee = Math.random() < this.config.trusteeProbability;
          
          // Track the mole in appropriate sets
          this.activeMoles.add(holeIndex);
          if (isTrustee) {
              this.activeTrustees.add(holeIndex);
          }
          
          // Show the mole with appropriate image
          this.ui.showMole(holeIndex, isTrustee);

          // Schedule removal AND PENALTY
          setTimeout(() => {
              // Only remove if it's still supposed to be active (wasn't whacked)
              // And if game hasn't been stopped/paused in the meantime
               if (this.gameRunning && !this.gamePaused && this.activeMoles.has(holeIndex)) {
                    // Penalty for not whacking
                    this.handleMiss();
                    this.activeMoles.delete(holeIndex);
                    if (isTrustee) {
                        this.activeTrustees.delete(holeIndex);
                    }
                    this.ui.hideMole(holeIndex);
               }
          }, this.config.characterDuration);
      }
  }


  /**
   * Schedule the next mole spawn at a random interval.
   */
  private _scheduleNextSpawn(): void {
      if (!this.gameRunning || this.gamePaused) return; // Don't schedule if not running or paused

      // Clear any existing spawn timeout to prevent duplicates if called rapidly
      if (this.spawnTimeoutId) {
           clearTimeout(this.spawnTimeoutId);
      }

      const nextInterval = Math.random() * (this.config.spawnIntervalMax - this.config.spawnIntervalMin) + this.config.spawnIntervalMin;
      this.spawnTimeoutId = setTimeout(() => {
          this._spawnMole();
          this._scheduleNextSpawn(); // Schedule the *next* one after this one runs
      }, nextInterval);
  }


  /**
   * Start the game timer.
   */
  private _startTimer(): void {
      // Prevent multiple timers
      if (this.countdownIntervalId) {
           clearInterval(this.countdownIntervalId);
      }
      this.countdownIntervalId = setInterval(() => this._tick(), 1000);
  }


  /**
   * Clear all active timers.
   */
  private _clearTimers(): void {
      if (this.countdownIntervalId) {
          clearInterval(this.countdownIntervalId);
      }
      if (this.spawnTimeoutId) {
          clearTimeout(this.spawnTimeoutId);
      }
      this.countdownIntervalId = null;
      this.spawnTimeoutId = null;
  }


  /**
   * Check if the game is currently running.
   * @returns True if the game is running, false otherwise.
   */
  public isRunning(): boolean {
       return this.gameRunning;
  }


  /**
   * Check if the game is currently paused.
   * @returns True if the game is paused, false otherwise.
   */
  public isPaused(): boolean {
      return this.gamePaused;
  }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const whackAMoleGame = new Game(UI, config);
  UI.init(whackAMoleGame); // Pass the game instance to UI and initialize UI
  whackAMoleGame.updateExplosionResources(); // Update explosion resources after UI is initialized
});
