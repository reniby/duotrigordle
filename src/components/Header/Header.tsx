import cn from "classnames";
import { useEffect, useMemo, useState } from "react";
import aboutIcon from "../../assets/about.svg";
import backIcon from "../../assets/back.svg";
import fullscreenExitIcon from "../../assets/fullscreen-exit.svg";
import fullscreenIcon from "../../assets/fullscreen.svg";
import logoIcon from "../../assets/logo.svg";
import restartIcon from "../../assets/restart.svg";
import settingsIcon from "../../assets/settings.svg";
import statsIcon from "../../assets/stats.svg";
import {
  gameAction,
  getCompletedBoards,
  getCompletedBoardsCount,
  loadGameFromLocalStorage,
  numBoards,
  numGuesses,
  uiAction,
  useAppDispatch,
  useAppSelector,
} from "../../store";
import { formatTimeElapsed, range } from "../../util";
import { AdBox } from "../AdBox/AdBox";
import { Button } from "../common/Button/Button";
import styles from "./Header.module.css";

export function Header() {
  const isWelcome = useAppSelector((s) => s.ui.view === "welcome");
  const wideMode = useAppSelector((s) => s.settings.wideMode);
  const colorBlind = useAppSelector((s) => s.settings.colorBlindMode);

  return (
    <div
      className={cn(
        styles.header,
        isWelcome && styles.welcome,
        wideMode && styles.wide,
        colorBlind && styles.colorBlind
      )}
    >
      <AdBox />
      <Row1 />
      <Row2 />
      <Row3 />
    </div>
  );
}

function Row1() {
  const dispatch = useAppDispatch();
  const { fullscreen, toggleFullscreen } = useFullscreen();
  const isGameView = useAppSelector((s) => s.ui.view === "game");
  const gameMode = useAppSelector((s) => s.game.gameMode);
  const gameId = useAppSelector((s) => s.game.id);
  const challenge = useAppSelector((s) => s.game.challenge);
  const showRestart = isGameView && gameMode !== "daily";

  const handleBackClick = () => {
    if (gameMode !== "daily") {
      const res = window.confirm(
        "Are you sure you want to quit your current game?"
      );
      if (!res) return;
      loadGameFromLocalStorage(dispatch);
    }
    dispatch(uiAction.setView("welcome"));
  };

  const handleRestartClick = () => {
    const res = window.confirm(
      "Are you sure you want to restart your current game? (You can also use ctrl+r)"
    );
    if (!res) return;
    dispatch(gameAction.restart({ timestamp: Date.now() }));
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement?.blur();
    }
  };

  const renderTitle = () => {
    if (!isGameView) {
      return "Duotrigordle";
    } else {
      if (challenge === "perfect") {
        return "Perfect Challenge";
      }
      const gameModeText =
        gameMode === "daily"
          ? "Daily"
          : gameMode === "practice"
          ? "Practice"
          : gameMode === "historic"
          ? "Historic"
          : "?????";
      const challengeText =
        challenge === "normal"
          ? "Duotrigordle"
          : challenge === "jumble"
          ? "Jumble"
          : challenge === "sequence"
          ? "Sequence"
          : "??????";
      const gameNumber =
        gameMode === "daily" || gameMode === "historic" ? ` #${gameId}` : "";
      return `${gameModeText} ${challengeText}${gameNumber}`;
    }
  };

  return (
    <div className={styles.row1}>
      <Button
        className={cn(styles.icon, !isGameView && styles.hidden)}
        onClick={handleBackClick}
      >
        <img
          className={styles.img}
          src={backIcon}
          alt="back"
          title="Back to Homepage"
        />
      </Button>
      <Button
        className={cn(styles.icon, !showRestart && styles.hidden)}
        onClick={handleRestartClick}
      >
        <img
          className={styles.img}
          src={restartIcon}
          alt="restart"
          title="Restart Game"
        />
      </Button>
      <div className={styles.titleWrapper}>
        <div className={styles.title}>
          {!isGameView ? (
            <img src={logoIcon} width={30} height={30} alt="Logo" />
          ) : null}
          <span className={styles.text}>{renderTitle()}</span>
        </div>
      </div>
      <Button
        className={styles.icon}
        onClick={() => dispatch(uiAction.showModal("stats"))}
      >
        <img
          className={styles.img}
          src={statsIcon}
          alt="statistics"
          title="Statistics"
        />
      </Button>
      <Button
        className={styles.icon}
        onClick={() => dispatch(uiAction.showModal("about"))}
      >
        <img className={styles.img} src={aboutIcon} alt="about" title="About" />
      </Button>
      <Button
        className={styles.icon}
        onClick={() => dispatch(uiAction.showModal("settings"))}
      >
        <img
          className={styles.img}
          src={settingsIcon}
          alt="settings"
          title="Settings"
        />
      </Button>
      <Button className={styles.icon} onClick={toggleFullscreen}>
        <img
          className={styles.img}
          src={fullscreen ? fullscreenExitIcon : fullscreenIcon}
          alt="toggle fullscreen"
          title="Toggle Fullscreen"
        />
      </Button>
    </div>
  );
}

function Row2() {
  const targets = useAppSelector((s) => s.game.targets);
  const guesses = useAppSelector((s) => s.game.guesses);
  const gameOver = useAppSelector((s) => s.game.gameOver);
  const boardsCompleted = useMemo(
    () => getCompletedBoardsCount(targets, guesses),
    [guesses, targets]
  );
  const challenge = useAppSelector((s) => s.game.challenge);
  const guessesNum = guesses.length;
  const maxGuesses = challenge === "perfect" ? numBoards : numGuesses;
  const extraGuessesNum =
    maxGuesses - numBoards - (guessesNum - boardsCompleted);
  const cannotWin = extraGuessesNum < 0;
  const extraGuesses =
    extraGuessesNum > 0 ? "+" + extraGuessesNum : extraGuessesNum;

  return (
    <div className={styles.row2}>
      <span>
        Boards: {boardsCompleted}/{numBoards}
      </span>
      <Timer />
      <span className={cn(cannotWin && !gameOver && styles.red)}>
        Guesses: {numGuesses}/{maxGuesses} ({extraGuesses})
      </span>
    </div>
  );
}

function Timer() {
  const showTimer = useAppSelector((s) => s.settings.showTimer);
  const startTime = useAppSelector((s) => s.game.startTime);
  const endTime = useAppSelector((s) => s.game.endTime);
  const gameStarted = useAppSelector((s) => s.game.guesses.length > 0);
  const gameOver = useAppSelector((s) => s.game.gameOver);
  const [now, setNow] = useState(() => Date.now());

  const timerText = useMemo(() => {
    if (!showTimer) {
      return "";
    } else if (!gameStarted) {
      return formatTimeElapsed(0);
    } else if (gameOver) {
      return formatTimeElapsed(endTime - startTime);
    } else {
      return formatTimeElapsed(now - startTime);
    }
  }, [now, showTimer, startTime, endTime, gameStarted, gameOver]);

  useEffect(() => {
    if (!showTimer) return;
    const interval = setInterval(() => {
      setNow(() => Date.now());
    }, 25);
    return () => clearInterval(interval);
  }, [showTimer]);

  return <span className={styles.timer}>{timerText}</span>;
}

function Row3() {
  const dispatch = useAppDispatch();
  const targets = useAppSelector((s) => s.game.targets);
  const guesses = useAppSelector((s) => s.game.guesses);
  const highlightedBoard = useAppSelector((s) => s.ui.highlightedBoard);
  const boardsCompleted = useMemo(
    () => getCompletedBoards(targets, guesses),
    [targets, guesses]
  );

  return (
    <div className={styles.row3}>
      {range(numBoards).map((i) => (
        <button
          key={i}
          className={cn(
            styles.chip,
            boardsCompleted[i]
              ? styles.green
              : highlightedBoard === i
              ? styles.white
              : null
          )}
          onClick={() =>
            dispatch(
              uiAction.createSideEffect({
                type: "scroll-board-into-view",
                board: i,
              })
            )
          }
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

// Type declarations for fullscreen stuff
declare global {
  interface Document {
    webkitFullscreenElement: Element | null;
    webkitExitFullscreen: () => void;
  }
  interface HTMLElement {
    webkitRequestFullscreen: () => void;
  }
}

function useFullscreen() {
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function enterFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    }
  }
  function exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
  function toggleFullscreen() {
    if (fullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }

  const [fullscreen, setFullscreen] = useState(isFullscreen);
  useEffect(() => {
    const handler = () => setFullscreen(isFullscreen);
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  return { fullscreen, enterFullscreen, exitFullscreen, toggleFullscreen };
}
