import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  CircleDot,
  Clock3,
  Flag,
  History,
  LogOut,
  Play,
  RotateCcw,
  Save,
  ShieldAlert,
  Trophy,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";

import { inningsAPI, matchAPI, scoreAPI, tournamentAPI } from "../services/api";

/* =========================================================
   HELPERS
========================================================= */

const getStoredRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return String(
      user?.role || user?.userRole || user?.authorities?.[0]?.authority || "",
    )
      .replace("ROLE_", "")
      .toUpperCase();
  } catch {
    return "";
  }
};

const canManageScores = () => {
  return ["ADMIN", "ORGANIZER", "SCORER"].includes(getStoredRole());
};

const emptyBatsman = {
  name: "",
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
};

const emptyBowler = {
  name: "",
  runs: 0,
  wickets: 0,
  balls: 0,
};

const emptyScore = {
  teamName: "",
  runs: 0,
  wickets: 0,
  balls: 0,
  overs: "0.0",
  target: null,
  striker: { ...emptyBatsman },
  nonStriker: { ...emptyBatsman },
  bowler: { ...emptyBowler },
};

const normalizeResponse = (response) => {
  return response?.data ?? response ?? {};
};

const getMatchId = (match) => {
  return match?.id ?? match?.matchId;
};

const getTournamentId = (match) => {
  return (
    match?.tournamentId ??
    match?.tournamentID ??
    match?.tournament?.id ??
    match?.tournament?.tournamentId
  );
};

const getMatchStatus = (match) => {
  return String(match?.status || "").toUpperCase();
};

const getTournamentName = (tournament) => {
  return (
    tournament?.name ||
    tournament?.tournamentName ||
    tournament?.tournament_name ||
    tournament?.shortName ||
    "Unnamed tournament"
  );
};

const getTeamId = (match, side) => {
  const team =
    side === 1
      ? match?.team1 || match?.teamA || match?.homeTeam
      : match?.team2 || match?.teamB || match?.awayTeam;

  return (
    team?.id ||
    (side === 1
      ? match?.team1Id || match?.teamAId || match?.homeTeamId
      : match?.team2Id || match?.teamBId || match?.awayTeamId)
  );
};

const getTeamName = (match, side) => {
  if (!match) return "";

  if (side === 1) {
    return (
      match?.team1?.name ||
      match?.team1?.teamName ||
      match?.teamA?.name ||
      match?.teamA?.teamName ||
      match?.team1Name ||
      match?.teamAName ||
      match?.homeTeam?.name ||
      match?.homeTeam?.teamName ||
      match?.homeTeamName ||
      "Team 1"
    );
  }

  return (
    match?.team2?.name ||
    match?.team2?.teamName ||
    match?.teamB?.name ||
    match?.teamB?.teamName ||
    match?.team2Name ||
    match?.teamBName ||
    match?.awayTeam?.name ||
    match?.awayTeam?.teamName ||
    match?.awayTeamName ||
    "Team 2"
  );
};

const getMatchName = (match) => {
  const explicitName = match?.name || match?.matchName;

  if (explicitName) {
    return explicitName;
  }

  return `${getTeamName(match, 1)} vs ${getTeamName(match, 2)}`;
};

const normalizeMatch = (match) => ({
  ...match,
  tournamentId: getTournamentId(match),
  name: getMatchName(match),
});

const getBallCount = (overs) => {
  if (typeof overs === "number") {
    const whole = Math.floor(overs);
    const decimal = Math.round((overs - whole) * 10);

    return whole * 6 + decimal;
  }

  if (typeof overs === "string" && overs.includes(".")) {
    const [over, ball] = overs.split(".");
    return Number(over || 0) * 6 + Number(ball || 0);
  }

  return 0;
};

const formatOvers = (balls) => {
  const numericBalls = Number(balls || 0);

  return `${Math.floor(numericBalls / 6)}.${numericBalls % 6}`;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Scoreboard() {
  const navigate = useNavigate();

  /* -------------------------------------------------------
     MATCH STATE
  ------------------------------------------------------- */

  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchId, setMatchId] = useState("");
  const [currentInningsId, setCurrentInningsId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [lastAction, setLastAction] = useState("");

  /* -------------------------------------------------------
     SCORE STATE
  ------------------------------------------------------- */

  const [score, setScore] = useState(emptyScore);

  const [strikerName, setStrikerName] = useState("");
  const [nonStrikerName, setNonStrikerName] = useState("");
  const [bowlerName, setBowlerName] = useState("");
  const [nextBowlerName, setNextBowlerName] = useState("");

  const [currentOverBalls, setCurrentOverBalls] = useState([]);
  const [history, setHistory] = useState([]);

  const [selectedRuns, setSelectedRuns] = useState(0);

  /* -------------------------------------------------------
     MATCH STATUS
  ------------------------------------------------------- */

  const [inningsCompleted, setInningsCompleted] = useState(false);
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [bowlerChangeRequired, setBowlerChangeRequired] = useState(false);

  const [showCompletedMatchList, setShowCompletedMatchList] = useState(false);

  /* -------------------------------------------------------
     MANUAL EXCEPTION STATE
  ------------------------------------------------------- */

  const [showExceptionPanel, setShowExceptionPanel] = useState(false);

  const [exceptionType, setExceptionType] = useState("NO_BALL");

  const [exceptionRuns, setExceptionRuns] = useState(0);

  const [exceptionWicket, setExceptionWicket] = useState(false);

  const [exceptionWicketType, setExceptionWicketType] = useState("RUN_OUT");

  const [exceptionDescription, setExceptionDescription] = useState("");

  /* -------------------------------------------------------
     PERMISSION
  ------------------------------------------------------- */

  const canUpdate = useMemo(() => canManageScores(), []);

  /* =======================================================
     LOAD MATCHES
  ======================================================= */

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await matchAPI.getAll();
      const data = normalizeResponse(response);

      const allMatches = (
        Array.isArray(data)
          ? data
          : data?.data || data?.content || data?.matches || []
      ).map(normalizeMatch);

      const list = selectedTournamentId
        ? allMatches.filter(
            (match) =>
              String(getTournamentId(match)) === String(selectedTournamentId),
          )
        : allMatches;

      setMatches(list);
    } catch (err) {
      console.error("LOAD MATCHES ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load matches.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTournaments = async () => {
    const response = await tournamentAPI.getAll();
    const data = normalizeResponse(response);
    const list = Array.isArray(data)
      ? data
      : data?.data || data?.content || data?.tournaments || [];

    setTournaments(
      list
        .filter((tournament) => tournament?.id)
        .map((tournament) => ({
          ...tournament,
          name: getTournamentName(tournament),
        })),
    );
  };

  useEffect(() => {
    Promise.all([loadTournaments(), loadMatches()]).catch((err) => {
      console.error("LOAD SCOREBOARD DATA ERROR:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load scoreboard data.",
      );
    });
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      setSelectedMatch(null);
      setMatchId("");
      resetScoreboardUI();
      loadMatches();
    }
  }, [selectedTournamentId]);

  /* =======================================================
     RESET UI
  ======================================================= */

  const resetScoreboardUI = () => {
    setScore(emptyScore);

    setStrikerName("");
    setNonStrikerName("");
    setBowlerName("");
    setNextBowlerName("");

    setCurrentOverBalls([]);
    setHistory([]);

    setSelectedRuns(0);

    setInningsCompleted(false);
    setMatchCompleted(false);
    setBowlerChangeRequired(false);

    setLastAction("");

    setShowExceptionPanel(false);

    setExceptionType("NO_BALL");
    setExceptionRuns(0);
    setExceptionWicket(false);
    setExceptionWicketType("RUN_OUT");
    setExceptionDescription("");
  };

  /* =======================================================
     INITIALIZE MATCH
  ======================================================= */

  const initializeMatch = async (match) => {
    const id = getMatchId(match);

    if (!id) return;

    try {
      setLoading(true);
      setError("");

      setSelectedMatch(match);
      setMatchId(id);

      resetScoreboardUI();

      /* CURRENT SCORE */

      try {
        const scoreResponse = await scoreAPI.getCurrent(id);

        const scoreData = normalizeResponse(scoreResponse);

        if (scoreData && Object.keys(scoreData).length > 0) {
          const balls = getBallCount(scoreData?.overs);

          setScore({
            ...emptyScore,
            ...scoreData,
            balls,
            overs: scoreData?.overs || formatOvers(balls),
            striker: {
              ...emptyBatsman,
              ...(scoreData?.striker || {}),
            },
            nonStriker: {
              ...emptyBatsman,
              ...(scoreData?.nonStriker || {}),
            },
            bowler: {
              ...emptyBowler,
              ...(scoreData?.bowler || {}),
            },
          });

          setStrikerName(scoreData?.striker?.name || "");
          setNonStrikerName(scoreData?.nonStriker?.name || "");
          setBowlerName(scoreData?.bowler?.name || "");
        }
      } catch (err) {
        console.log("No current score yet.");
      }

      /* CURRENT INNINGS */

      try {
        const inningsResponse = await inningsAPI.getCurrent(id);

        const inningsPayload = normalizeResponse(inningsResponse);
        const inningsData = Array.isArray(inningsPayload)
          ? inningsPayload[inningsPayload.length - 1]
          : inningsPayload?.data || inningsPayload;

        if (inningsData) {
          setCurrentInningsId(inningsData?.id || null);
          const inningsRuns = Number(
            inningsData?.runs ||
              inningsData?.totalRuns ||
              inningsData?.score ||
              0,
          );

          const inningsWickets = Number(
            inningsData?.wickets || inningsData?.totalWickets || 0,
          );

          const inningsOvers =
            inningsData?.overs || formatOvers(getBallCount(inningsData?.overs));

          const inningsBalls = getBallCount(inningsOvers);

          setScore((prev) => ({
            ...prev,
            runs: inningsRuns || prev.runs,
            wickets: inningsWickets || prev.wickets,
            balls: inningsBalls || prev.balls,
            overs: inningsOvers || prev.overs,
            teamName:
              inningsData?.battingTeam?.name ||
              inningsData?.teamName ||
              prev.teamName,
            target:
              inningsData?.target || inningsData?.targetRuns || prev.target,
          }));
        }
      } catch (err) {
        console.log("No innings data yet.");
      }

      const status = getMatchStatus(match);

      setMatchCompleted(status === "COMPLETED");
      setInningsCompleted(
        status === "INNINGS_COMPLETED" || status === "COMPLETED",
      );
    } catch (err) {
      console.error("INITIALIZE MATCH ERROR:", err);

      setError(
        err?.response?.data?.message || err?.message || "Unable to open match.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     SELECT MATCH
  ======================================================= */

  const handleMatchSelect = async (event) => {
    const id = event.target.value;

    if (!id) {
      setSelectedMatch(null);
      setMatchId("");
      resetScoreboardUI();
      return;
    }

    const match = matches.find(
      (item) => String(getMatchId(item)) === String(id),
    );

    if (match) {
      await initializeMatch(match);
    }
  };

  /* =======================================================
     START MATCH
  ======================================================= */

  const handleStartMatch = async () => {
    if (!canUpdate) {
      setError("You do not have permission to start this match.");
      return;
    }

    if (!matchId) {
      setError("Please select a match first.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await matchAPI.start(matchId);

      setLastAction("Match started successfully.");

      await loadMatches();

      const refreshedMatch =
        matches.find((item) => String(getMatchId(item)) === String(matchId)) ||
        selectedMatch;

      if (refreshedMatch) {
        await initializeMatch({
          ...refreshedMatch,
          status: "LIVE",
        });
      }
    } catch (err) {
      console.error("START MATCH ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to start match.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     ANOTHER MATCH
  ======================================================= */

  const handleAnotherMatch = () => {
    setSelectedMatch(null);
    setMatchId("");
    resetScoreboardUI();
    setShowCompletedMatchList(false);
  };

  /* =======================================================
     BALL ENTRY
  ======================================================= */

  const createBallEntry = ({
    label,
    teamRuns,
    batsmanRuns = 0,
    wicket = false,
    legalBall = true,
    wicketType = "",
    description = "",
  }) => {
    return {
      id: `${Date.now()}-${Math.random()}`,

      label,

      teamRuns: Number(teamRuns || 0),

      batsmanRuns: Number(batsmanRuns || 0),

      wicket: Boolean(wicket),

      legalBall: Boolean(legalBall),

      wicketType,

      description,

      overBallNumber: currentOverBalls.length + 1,

      striker: strikerName,

      nonStriker: nonStrikerName,

      bowler: bowlerName,

      timestamp: new Date().toLocaleTimeString(),
    };
  };

  /* =======================================================
     CORE DELIVERY FUNCTION
  ======================================================= */

  const recordDelivery = async ({
    runs = 0,
    batsmanRuns = null,
    wicket = false,
    label = "",
    legalBall = true,
    wicketType = "",
    description = "",
  }) => {
    if (!canUpdate) {
      setError("You do not have permission to update scores.");
      return false;
    }

    if (!matchId) {
      setError("Please select a match.");
      return false;
    }

    if (matchCompleted || inningsCompleted) {
      setError("This innings/match has already been completed.");
      return false;
    }

    if (bowlerChangeRequired) {
      setError("Please enter the new bowler before recording a ball.");
      return false;
    }

    if (!strikerName || !nonStrikerName || !bowlerName) {
      setError("Please enter striker, non-striker and bowler before scoring.");
      return false;
    }

    const numericRuns = Number(runs || 0);

    const numericBatsmanRuns =
      batsmanRuns === null ? numericRuns : Number(batsmanRuns || 0);

    if (numericRuns < 0 || numericBatsmanRuns < 0) {
      setError("Runs cannot be negative.");
      return false;
    }

    if (numericBatsmanRuns > numericRuns) {
      setError("Batsman runs cannot be greater than total team runs.");
      return false;
    }

    try {
      setSaving(true);
      setError("");

      /* ---------------------------------------------------
         SEND TO BACKEND
      --------------------------------------------------- */

      await scoreAPI.recordBall({
        matchId: Number(matchId),

        runs: numericRuns,

        wicket: Boolean(wicket),

        ballType: label,

        batsmanRuns: numericBatsmanRuns,

        wicketType: wicket ? wicketType : null,

        description: description || null,

        legalBall: Boolean(legalBall),
      });

      /* ---------------------------------------------------
         SCORE UPDATE
      --------------------------------------------------- */

      const previousScore = score;

      const newRuns = Number(previousScore.runs || 0) + numericRuns;

      const newWickets = Number(previousScore.wickets || 0) + (wicket ? 1 : 0);

      const newBalls = Number(previousScore.balls || 0) + (legalBall ? 1 : 0);

      const newOvers = formatOvers(newBalls);

      /* ---------------------------------------------------
         STRIKER UPDATE
      --------------------------------------------------- */

      const updatedStriker = {
        ...previousScore.striker,

        name: strikerName,

        runs: Number(previousScore.striker?.runs || 0) + numericBatsmanRuns,

        balls: Number(previousScore.striker?.balls || 0) + (legalBall ? 1 : 0),

        fours:
          Number(previousScore.striker?.fours || 0) +
          (numericBatsmanRuns === 4 ? 1 : 0),

        sixes:
          Number(previousScore.striker?.sixes || 0) +
          (numericBatsmanRuns === 6 ? 1 : 0),
      };

      /* ---------------------------------------------------
         BOWLER UPDATE
      --------------------------------------------------- */

      const updatedBowler = {
        ...previousScore.bowler,

        name: bowlerName,

        runs: Number(previousScore.bowler?.runs || 0) + numericRuns,

        wickets: Number(previousScore.bowler?.wickets || 0) + (wicket ? 1 : 0),

        balls: Number(previousScore.bowler?.balls || 0) + (legalBall ? 1 : 0),
      };

      /* ---------------------------------------------------
         UPDATE SCORE
      --------------------------------------------------- */

      setScore((prev) => ({
        ...prev,

        runs: newRuns,

        wickets: newWickets,

        balls: newBalls,

        overs: newOvers,

        striker: updatedStriker,

        bowler: updatedBowler,
      }));

      /* ---------------------------------------------------
         DISPLAY ENTRY
      --------------------------------------------------- */

      const entry = createBallEntry({
        label,
        teamRuns: numericRuns,
        batsmanRuns: numericBatsmanRuns,
        wicket,
        legalBall,
        wicketType,
        description,
      });

      setCurrentOverBalls((prev) => {
        const next = [...prev, entry];

        return next;
      });

      setHistory((prev) => [
        ...prev,

        {
          ...entry,

          previousScore: {
            ...previousScore,

            striker: {
              ...previousScore.striker,
            },

            nonStriker: {
              ...previousScore.nonStriker,
            },

            bowler: {
              ...previousScore.bowler,
            },
          },
        },
      ]);

      /* ---------------------------------------------------
         STRIKE ROTATION
      --------------------------------------------------- */

      let shouldSwapStrike = numericBatsmanRuns % 2 === 1;

      /* ---------------------------------------------------
         WICKET
      --------------------------------------------------- */

      if (wicket) {
        setStrikerName("");
        setScore((prev) => ({
          ...prev,
          striker: {
            ...emptyBatsman,
          },
        }));
      }

      /* ---------------------------------------------------
         END OF OVER
      --------------------------------------------------- */

      if (legalBall && newBalls % 6 === 0) {
        shouldSwapStrike = !shouldSwapStrike;

        setCurrentOverBalls([]);

        setBowlerChangeRequired(true);

        setNextBowlerName("");

        setLastAction(
          `${label || "Ball"} recorded. Over completed. Enter new bowler.`,
        );
      } else {
        setLastAction(`${label || "Ball"} recorded successfully.`);
      }

      /* ---------------------------------------------------
         STRIKE SWAP
      --------------------------------------------------- */

      if (!wicket && shouldSwapStrike) {
        const rotatedStriker = nonStrikerName;
        const rotatedNonStriker = strikerName;

        setStrikerName(rotatedStriker);
        setNonStrikerName(rotatedNonStriker);

        setScore((prev) => ({
          ...prev,
          striker: {
            ...prev.nonStriker,
            name: rotatedStriker,
          },
          nonStriker: {
            ...prev.striker,
            name: rotatedNonStriker,
          },
        }));
      }

      /* ---------------------------------------------------
         TARGET CHECK
      --------------------------------------------------- */

      const target = Number(previousScore.target || 0);

      if (target > 0 && newRuns >= target) {
        setMatchCompleted(true);

        setLastAction(`Target reached! ${getTeamName(selectedMatch, 1)} wins.`);
      }

      /* ---------------------------------------------------
         ALL OUT
      --------------------------------------------------- */

      if (newWickets >= 10) {
        setInningsCompleted(true);

        setLastAction("All out. Innings completed.");
      }

      return true;
    } catch (err) {
      console.error("RECORD BALL ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to record delivery.",
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     NORMAL RUN
  ======================================================= */

  const handleRuns = async (runs) => {
    setSelectedRuns(runs);

    await recordDelivery({
      runs,
      batsmanRuns: runs,
      wicket: false,
      label: String(runs),
      legalBall: true,
    });
  };

  /* =======================================================
     DOT BALL
  ======================================================= */

  const handleDotBall = async () => {
    setSelectedRuns(0);

    await recordDelivery({
      runs: 0,
      batsmanRuns: 0,
      wicket: false,
      label: "0",
      legalBall: true,
    });
  };

  /* =======================================================
     SIMPLE WIDE
  ======================================================= */

  const handleWide = async () => {
    await recordDelivery({
      runs: 1,
      batsmanRuns: 0,
      wicket: false,
      label: "WD",
      legalBall: false,
    });
  };

  /* =======================================================
     SIMPLE NO BALL
  ======================================================= */

  const handleNoBall = async () => {
    await recordDelivery({
      runs: 1,
      batsmanRuns: 0,
      wicket: false,
      label: "NB",
      legalBall: false,
    });
  };

  /* =======================================================
     SIMPLE WICKET
  ======================================================= */

  const handleWicket = async () => {
    await recordDelivery({
      runs: 0,
      batsmanRuns: 0,
      wicket: true,
      label: "W",
      legalBall: true,
      wicketType: "WICKET",
    });
  };

  /* =======================================================
     MANUAL EXCEPTION
  ======================================================= */

  const recordManualException = async () => {
    let totalRuns = 0;
    let batsmanRuns = 0;
    let legalBall = true;
    let label = "";

    /* ---------------------------------------------------
       NO BALL
    --------------------------------------------------- */

    if (exceptionType === "NO_BALL") {
      const batRuns = Number(exceptionRuns || 0);

      totalRuns = 1 + batRuns;

      batsmanRuns = batRuns;

      legalBall = false;

      if (exceptionWicket) {
        label = "NB + W";
      } else if (batRuns > 0) {
        label = `NB + ${batRuns}`;
      } else {
        label = "NB";
      }
    }

    /* ---------------------------------------------------
       WIDE
    --------------------------------------------------- */

    if (exceptionType === "WIDE") {
      const wideRuns = Number(exceptionRuns || 0);

      totalRuns = 1 + wideRuns;

      batsmanRuns = 0;

      legalBall = false;

      if (exceptionWicket) {
        label = "WD + W";
      } else if (wideRuns > 0) {
        label = `WD + ${wideRuns}`;
      } else {
        label = "WD";
      }
    }

    /* ---------------------------------------------------
       LEGAL WICKET
    --------------------------------------------------- */

    if (exceptionType === "LEGAL_WICKET") {
      const batRuns = Number(exceptionRuns || 0);

      totalRuns = batRuns;

      batsmanRuns = batRuns;

      legalBall = true;

      if (batRuns > 0) {
        label = `${batRuns} + W`;
      } else {
        label = "W";
      }
    }

    /* ---------------------------------------------------
       RUN OUT
    --------------------------------------------------- */

    if (exceptionType === "RUN_OUT") {
      const batRuns = Number(exceptionRuns || 0);

      totalRuns = batRuns;

      batsmanRuns = batRuns;

      legalBall = true;

      if (batRuns > 0) {
        label = `${batRuns} + W (RUN OUT)`;
      } else {
        label = "W (RUN OUT)";
      }
    }

    const success = await recordDelivery({
      runs: totalRuns,

      batsmanRuns,

      wicket: exceptionWicket || exceptionType === "RUN_OUT",

      label,

      legalBall,

      wicketType:
        exceptionWicket || exceptionType === "RUN_OUT"
          ? exceptionWicketType || "RUN_OUT"
          : "",

      description: exceptionDescription,
    });

    if (success) {
      setExceptionRuns(0);

      setExceptionWicket(false);

      setExceptionWicketType("RUN_OUT");

      setExceptionDescription("");

      setExceptionType("NO_BALL");
    }
  };

  /* =======================================================
     QUICK EXCEPTION BUTTONS
  ======================================================= */

  const applyQuickException = async (type) => {
    if (type === "NB_W") {
      setExceptionType("NO_BALL");
      setExceptionRuns(0);
      setExceptionWicket(true);
      setExceptionWicketType("RUN_OUT");

      await recordDelivery({
        runs: 1,
        batsmanRuns: 0,
        wicket: true,
        label: "NB + W",
        legalBall: false,
        wicketType: "RUN_OUT",
      });

      return;
    }

    if (type === "NB_4") {
      setExceptionType("NO_BALL");
      setExceptionRuns(4);
      setExceptionWicket(false);

      await recordDelivery({
        runs: 5,
        batsmanRuns: 4,
        wicket: false,
        label: "NB + 4",
        legalBall: false,
      });

      return;
    }

    if (type === "NB_6") {
      setExceptionType("NO_BALL");
      setExceptionRuns(6);
      setExceptionWicket(false);

      await recordDelivery({
        runs: 7,
        batsmanRuns: 6,
        wicket: false,
        label: "NB + 6",
        legalBall: false,
      });

      return;
    }

    if (type === "WD_W") {
      setExceptionType("WIDE");
      setExceptionRuns(0);
      setExceptionWicket(true);
      setExceptionWicketType("RUN_OUT");

      await recordDelivery({
        runs: 1,
        batsmanRuns: 0,
        wicket: true,
        label: "WD + W",
        legalBall: false,
        wicketType: "RUN_OUT",
      });

      return;
    }

    if (type === "WD_4") {
      setExceptionType("WIDE");
      setExceptionRuns(4);
      setExceptionWicket(false);

      await recordDelivery({
        runs: 5,
        batsmanRuns: 0,
        wicket: false,
        label: "WD + 4",
        legalBall: false,
      });

      return;
    }

    if (type === "WD_6") {
      setExceptionType("WIDE");
      setExceptionRuns(6);
      setExceptionWicket(false);

      await recordDelivery({
        runs: 7,
        batsmanRuns: 0,
        wicket: false,
        label: "WD + 6",
        legalBall: false,
      });

      return;
    }

    if (type === "1_W") {
      await recordDelivery({
        runs: 1,
        batsmanRuns: 1,
        wicket: true,
        label: "1 + W",
        legalBall: true,
        wicketType: "RUN_OUT",
      });

      return;
    }

    if (type === "2_W") {
      await recordDelivery({
        runs: 2,
        batsmanRuns: 2,
        wicket: true,
        label: "2 + W",
        legalBall: true,
        wicketType: "RUN_OUT",
      });

      return;
    }

    if (type === "3_W") {
      await recordDelivery({
        runs: 3,
        batsmanRuns: 3,
        wicket: true,
        label: "3 + W",
        legalBall: true,
        wicketType: "RUN_OUT",
      });

      return;
    }

    if (type === "W") {
      await recordDelivery({
        runs: 0,
        batsmanRuns: 0,
        wicket: true,
        label: "W",
        legalBall: true,
        wicketType: "RUN_OUT",
      });
    }
  };

  /* =======================================================
     CHANGE BOWLER
  ======================================================= */

  const changeBowler = () => {
    if (!nextBowlerName.trim()) {
      setError("Enter the new bowler name.");
      return;
    }

    setBowlerName(nextBowlerName.trim());

    setScore((prev) => ({
      ...prev,

      bowler: {
        ...emptyBowler,
        name: nextBowlerName.trim(),
      },
    }));

    setNextBowlerName("");

    setBowlerChangeRequired(false);

    setLastAction(`New bowler set: ${nextBowlerName.trim()}`);

    setError("");
  };

  /* =======================================================
     UNDO
  ======================================================= */

  const undoLastBall = async () => {
    if (!canUpdate) {
      setError("You do not have permission to undo.");
      return;
    }

    if (history.length === 0) {
      setError("Nothing to undo.");
      return;
    }

    /*
      IMPORTANT:
      This restores frontend state.

      If your backend has an undo/delete-ball endpoint,
      connect it here as well.
    */

    const last = history[history.length - 1];

    if (!last?.previousScore) {
      setError("Unable to restore previous score.");
      return;
    }

    setScore(last.previousScore);

    setStrikerName(last.previousScore?.striker?.name || "");
    setNonStrikerName(last.previousScore?.nonStriker?.name || "");
    setBowlerName(last.previousScore?.bowler?.name || "");

    setHistory((prev) => prev.slice(0, -1));

    setCurrentOverBalls((prev) => {
      if (prev.length > 0) {
        return prev.slice(0, -1);
      }

      return [];
    });

    setBowlerChangeRequired(false);

    setLastAction(`Undo: ${last.label || "last delivery"}`);
  };

  /* =======================================================
     END FIRST INNINGS
  ======================================================= */

  // const endFirstInnings = async () => {
  //   if (!canUpdate) {
  //     setError("You do not have permission.");
  //     return;
  //   }

  //   if (!matchId) {
  //     setError("Please select a match.");
  //     return;
  //   }

  //   try {
  //     setSaving(true);
  //     setError("");

  //     let inningsId = currentInningsId;

  //     if (!inningsId) {
  //       const response = await inningsAPI.getCurrent(matchId);
  //       const payload = normalizeResponse(response);
  //       const latest = Array.isArray(payload)
  //         ? payload[payload.length - 1]
  //         : payload?.data || payload;
  //       inningsId = latest?.id;
  //     }

  //     if (!inningsId) {
  //       throw new Error("Current innings was not found.");
  //     }

  //     await inningsAPI.complete(inningsId);
  //     setCurrentInningsId(inningsId);
  //     setInningsCompleted(true);
  //     setLastAction("First innings completed. Start the second innings.");
  //   } catch (err) {
  //     setError(
  //       err?.response?.data?.message ||
  //         err?.message ||
  //         "Unable to complete first innings.",
  //     );
  //   } finally {
  //     setSaving(false);
  //   }
  // };
  const endFirstInnings = async () => {
    if (!canUpdate) {
      setError("You do not have permission.");
      return;
    }

    if (!matchId) {
      setError("Please select a match.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      console.log("ENDING INNINGS");
      console.log("Match ID:", matchId);
      console.log("Current innings ID:", currentInningsId);

      let inningsId = currentInningsId;

      // --------------------------------------------------
      // IF WE DON'T HAVE ID, LOAD CURRENT INNINGS
      // --------------------------------------------------

      if (!inningsId) {
        const response = await inningsAPI.getCurrent(Number(matchId));

        const data = response?.data ?? response;

        console.log("CURRENT INNINGS RESPONSE:", data);

        if (Array.isArray(data)) {
          const liveInnings = data.find(
            (item) => String(item?.status).toUpperCase() === "LIVE",
          );

          inningsId = liveInnings?.id || data[data.length - 1]?.id;
        } else {
          inningsId = data?.id || data?.data?.id;
        }
      }

      // --------------------------------------------------
      // STILL NO ID
      // --------------------------------------------------

      if (!inningsId) {
        throw new Error(
          "No innings exists for this match. Start the match first.",
        );
      }

      console.log("COMPLETING INNINGS ID:", inningsId);

      // --------------------------------------------------
      // COMPLETE BACKEND INNINGS
      // --------------------------------------------------

      const response = await inningsAPI.complete(Number(inningsId));

      console.log("INNINGS COMPLETED:", response);

      // --------------------------------------------------
      // UPDATE FRONTEND
      // --------------------------------------------------

      setCurrentInningsId(Number(inningsId));

      setInningsCompleted(true);

      setLastAction("First innings completed. Start the second innings.");

      setError("");
    } catch (err) {
      console.error("END INNINGS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Unable to complete first innings.",
      );
    } finally {
      setSaving(false);
    }
  };
  const startSecondInnings = async () => {
    if (!canUpdate) {
      setError("You do not have permission.");
      return;
    }

    const battingTeamId = getTeamId(selectedMatch, 2);
    const bowlingTeamId = getTeamId(selectedMatch, 1);

    if (!matchId || !battingTeamId || !bowlingTeamId) {
      setError("The selected match does not have both teams.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const firstInningsRuns = Number(score.runs || 0);

      const inningsResponse = await inningsAPI.create({
        matchId: Number(matchId),
        inningsNumber: 2,
        battingTeamId: Number(battingTeamId),
        bowlingTeamId: Number(bowlingTeamId),
        target: firstInningsRuns + 1,
      });

      await scoreAPI.resetForNewInnings(Number(matchId));

      const inningsData = normalizeResponse(inningsResponse);
      setCurrentInningsId(inningsData?.id || null);
      resetScoreboardUI();
      setScore({
        ...emptyScore,
        target: firstInningsRuns + 1,
        teamName: getTeamName(selectedMatch, 2),
      });
      setInningsCompleted(false);
      setLastAction(
        `${getTeamName(selectedMatch, 2)} batting. Target: ${firstInningsRuns + 1}.`,
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to start second innings.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     COMPLETE MATCH
  ======================================================= */

  const completeMatch = async () => {
    if (!canUpdate) {
      setError("You do not have permission.");
      return;
    }

    if (!matchId || !selectedMatch) {
      setError("Please select a match.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await matchAPI.update(matchId, {
        ...selectedMatch,
        status: "COMPLETED",
      });

      setMatchCompleted(true);

      setLastAction("Match marked as COMPLETED.");

      await loadMatches();
    } catch (err) {
      console.error("COMPLETE MATCH ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to complete match.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     EXCEPTION PREVIEW
  ======================================================= */

  const getExceptionPreview = () => {
    let totalRuns = 0;
    let batsmanRuns = 0;
    let label = "";
    let legal = true;

    if (exceptionType === "NO_BALL") {
      batsmanRuns = Number(exceptionRuns || 0);

      totalRuns = 1 + batsmanRuns;

      legal = false;

      if (exceptionWicket) {
        label = "NB + W";
      } else if (batsmanRuns > 0) {
        label = `NB + ${batsmanRuns}`;
      } else {
        label = "NB";
      }
    }

    if (exceptionType === "WIDE") {
      const additionalWideRuns = Number(exceptionRuns || 0);

      totalRuns = 1 + additionalWideRuns;

      batsmanRuns = 0;

      legal = false;

      if (exceptionWicket) {
        label = "WD + W";
      } else if (additionalWideRuns > 0) {
        label = `WD + ${additionalWideRuns}`;
      } else {
        label = "WD";
      }
    }

    if (exceptionType === "LEGAL_WICKET") {
      batsmanRuns = Number(exceptionRuns || 0);

      totalRuns = batsmanRuns;

      legal = true;

      label = batsmanRuns > 0 ? `${batsmanRuns} + W` : "W";
    }

    if (exceptionType === "RUN_OUT") {
      batsmanRuns = Number(exceptionRuns || 0);

      totalRuns = batsmanRuns;

      legal = true;

      label = batsmanRuns > 0 ? `${batsmanRuns} + W` : "W";
    }

    return {
      totalRuns,
      batsmanRuns,
      label,
      legal,
      wicket: exceptionWicket || exceptionType === "RUN_OUT",
    };
  };

  const exceptionPreview = getExceptionPreview();

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="scoreboard-page">
      {/* ===================================================
          TOP HEADER
      =================================================== */}

      <header className="scoreboard-header">
        <div className="header-left">
          <button
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <div className="page-brand">
            <div className="brand-icon">
              <Trophy size={21} />
            </div>

            <div>
              <h1>Live Scoreboard</h1>
              <p>Cricket Command Center</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="role-badge">
            <ShieldAlert size={15} />
            {getStoredRole() || "VIEWER"}
          </div>
        </div>
      </header>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="scoreboard-content">
        {/* ERROR */}

        {error && (
          <div className="error-banner">
            <ShieldAlert size={19} />

            <span>{error}</span>

            <button onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {/* =================================================
            MATCH SELECTOR
        ================================================= */}

        <section className="match-selector-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MATCH CENTER</span>

              <h2>Select Match</h2>

              <p>Choose a scheduled or live match to manage its scoreboard.</p>
            </div>

            <div className="live-indicator">
              <span />
              LIVE SCORING
            </div>
          </div>

          <div className="match-select-wrapper">
            <select
              value={selectedTournamentId}
              onChange={(event) => setSelectedTournamentId(event.target.value)}
            >
              <option value="">Select a tournament...</option>

              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {getTournamentName(tournament)}
                </option>
              ))}
            </select>

            <ChevronDown size={18} />
          </div>

          <div className="match-select-wrapper">
            <select value={matchId} onChange={handleMatchSelect}>
              <option value="">Select a match...</option>

              {matches.map((match) => (
                <option key={getMatchId(match)} value={getMatchId(match)}>
                  {getMatchName(match)}{" "}
                  {getMatchStatus(match) ? `— ${getMatchStatus(match)}` : ""}
                </option>
              ))}
            </select>

            <ChevronDown size={18} />
          </div>

          {selectedTournamentId && matches.length === 0 && !loading && (
            <p>No matches have been created for this tournament.</p>
          )}
        </section>

        {/* =================================================
            NO MATCH
        ================================================= */}

        {!selectedMatch && (
          <section className="empty-scoreboard-card">
            <div className="empty-icon">
              <CircleDot size={40} />
            </div>

            <h2>No Match Selected</h2>

            <p>Select a match above to open the live scoring center.</p>
          </section>
        )}

        {/* =================================================
            START MATCH
        ================================================= */}

        {selectedMatch &&
          !matchCompleted &&
          getMatchStatus(selectedMatch) !== "LIVE" &&
          !score.runs &&
          !inningsCompleted && (
            <section className="start-match-card">
              <div className="start-match-icon">
                <Play size={30} />
              </div>

              <div className="start-match-content">
                <span className="eyebrow">MATCH READY</span>

                <h2>
                  {getTeamName(selectedMatch, 1)}
                  <span> vs </span>
                  {getTeamName(selectedMatch, 2)}
                </h2>

                <p>Start the match to begin live scoring.</p>
              </div>

              {canUpdate && (
                <button
                  className="primary-action-button"
                  onClick={handleStartMatch}
                  disabled={saving}
                >
                  <Play size={17} />
                  Start Match
                </button>
              )}
            </section>
          )}

        {/* =================================================
            COMPLETED
        ================================================= */}

        {selectedMatch && matchCompleted && (
          <section className="completed-match-card">
            <div className="completed-icon">
              <Trophy size={32} />
            </div>

            <div>
              <span className="eyebrow">MATCH COMPLETED</span>

              <h2>
                {getTeamName(selectedMatch, 1)}
                <span> vs </span>
                {getTeamName(selectedMatch, 2)}
              </h2>

              <p>This match has been completed.</p>
            </div>

            <button
              className="secondary-action-button"
              onClick={handleAnotherMatch}
            >
              <RotateCcw size={16} />
              Another Match
            </button>
          </section>
        )}

        {/* =================================================
            LIVE SCORE
        ================================================= */}

        {selectedMatch &&
          !matchCompleted &&
          (getMatchStatus(selectedMatch) === "LIVE" ||
            score.runs > 0 ||
            inningsCompleted) && (
            <>
              {/* SCORE HERO */}

              <section className="score-hero">
                <div className="score-hero-top">
                  <div>
                    <span className="eyebrow">
                      {score.teamName || getTeamName(selectedMatch, 1)}
                    </span>

                    <h2>
                      {score.runs}
                      <span>/</span>
                      {score.wickets}
                    </h2>

                    <p>{score.overs} overs</p>
                  </div>

                  <div className="target-box">
                    <span>TARGET</span>

                    <strong>{score.target || "—"}</strong>
                  </div>
                </div>

                <div className="score-meta">
                  <div>
                    <Clock3 size={15} />
                    {score.overs} Overs
                  </div>

                  <div>
                    <Zap size={15} />
                    {score.balls} Legal Balls
                  </div>

                  <div>
                    <Flag size={15} />
                    {score.wickets} Wickets
                  </div>
                </div>
              </section>

              {/* LAST ACTION */}

              {lastAction && (
                <div className="last-action">
                  <Zap size={17} />

                  <span>{lastAction}</span>
                </div>
              )}

              {/* =================================================
                  NEW BOWLER
              ================================================= */}

              {bowlerChangeRequired && (
                <section className="new-bowler-card">
                  <div className="new-bowler-icon">
                    <Users size={23} />
                  </div>

                  <div className="new-bowler-text">
                    <span className="eyebrow">OVER COMPLETED</span>

                    <h3>Enter New Bowler</h3>

                    <p>The next legal delivery requires a new bowler.</p>
                  </div>

                  <div className="new-bowler-form">
                    <input
                      value={nextBowlerName}
                      onChange={(e) => setNextBowlerName(e.target.value)}
                      placeholder="New bowler name"
                    />

                    <button onClick={changeBowler} disabled={saving}>
                      Save Bowler
                    </button>
                  </div>
                </section>
              )}

              {/* =================================================
                  PLAYERS
              ================================================= */}

              <section className="players-grid">
                {/* STRIKER */}

                <div className="player-card striker-card">
                  <div className="player-card-header">
                    <span className="player-role">STRIKER</span>

                    <div className="batting-dot" />
                  </div>

                  <div className="player-name">
                    <User size={18} />

                    <input
                      value={strikerName}
                      onChange={(e) => setStrikerName(e.target.value)}
                      placeholder="Striker name"
                      disabled={!canUpdate}
                    />
                  </div>

                  <div className="player-stat">
                    <strong>{score.striker?.runs || 0}</strong>

                    <span>({score.striker?.balls || 0})</span>
                  </div>

                  <div className="player-mini-stats">
                    <span>
                      4s <strong>{score.striker?.fours || 0}</strong>
                    </span>

                    <span>
                      6s <strong>{score.striker?.sixes || 0}</strong>
                    </span>
                  </div>
                </div>

                {/* NON STRIKER */}

                <div className="player-card">
                  <div className="player-card-header">
                    <span className="player-role">NON-STRIKER</span>
                  </div>

                  <div className="player-name">
                    <User size={18} />

                    <input
                      value={nonStrikerName}
                      onChange={(e) => setNonStrikerName(e.target.value)}
                      placeholder="Non-striker name"
                      disabled={!canUpdate}
                    />
                  </div>

                  <div className="player-stat">
                    <strong>{score.nonStriker?.runs || 0}</strong>

                    <span>({score.nonStriker?.balls || 0})</span>
                  </div>

                  <div className="player-mini-stats">
                    <span>
                      4s <strong>{score.nonStriker?.fours || 0}</strong>
                    </span>

                    <span>
                      6s <strong>{score.nonStriker?.sixes || 0}</strong>
                    </span>
                  </div>
                </div>

                {/* BOWLER */}

                <div className="player-card bowler-card">
                  <div className="player-card-header">
                    <span className="player-role">BOWLER</span>
                  </div>

                  <div className="player-name">
                    <User size={18} />

                    <input
                      value={bowlerName}
                      onChange={(e) => setBowlerName(e.target.value)}
                      placeholder="Bowler name"
                      disabled={!canUpdate}
                    />
                  </div>

                  <div className="bowler-stat-line">
                    <strong>{score.bowler?.runs || 0}</strong>

                    <span>runs</span>

                    <strong>{score.bowler?.wickets || 0}</strong>

                    <span>wickets</span>
                  </div>
                </div>
              </section>

              {/* =================================================
                  CURRENT OVER
              ================================================= */}

              <section className="current-over-card">
                <div className="current-over-header">
                  <div>
                    <span className="eyebrow">BALL BY BALL</span>

                    <h3>Current Over</h3>
                  </div>

                  <div className="over-number">
                    Over{" "}
                    {Math.floor(Number(score.balls || 0) / 6) +
                      (Number(score.balls || 0) % 6 === 0 ? 0 : 1)}
                  </div>
                </div>

                <div className="current-over-balls">
                  {currentOverBalls.length === 0 && (
                    <div className="empty-over">No deliveries recorded yet</div>
                  )}

                  {currentOverBalls.map((ball) => (
                    <div
                      key={ball.id}
                      className={`ball-result ${
                        ball.wicket ? "ball-wicket" : ""
                      } ${!ball.legalBall ? "ball-extra" : ""}`}
                      title={ball.description || ball.label}
                    >
                      <strong>{ball.label}</strong>

                      {ball.wicket && (
                        <span className="ball-wicket-mark">W</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="over-legend">
                  <span>
                    <i className="legend-dot legal" />
                    Legal
                  </span>

                  <span>
                    <i className="legend-dot extra" />
                    Extra
                  </span>

                  <span>
                    <i className="legend-dot wicket" />
                    Wicket
                  </span>
                </div>
              </section>

              {/* =================================================
                  SCORING
              ================================================= */}

              {canUpdate && (
                <section className="scoring-card">
                  <div className="scoring-header">
                    <div>
                      <span className="eyebrow">LIVE SCORING</span>

                      <h3>Record Delivery</h3>
                    </div>

                    <div className="selected-run">
                      Selected <strong>{selectedRuns}</strong>
                    </div>
                  </div>

                  {/* RUNS */}

                  <div className="run-buttons">
                    <button onClick={handleDotBall} className="run-button dot">
                      0
                    </button>

                    {[1, 2, 3, 4, 6].map((run) => (
                      <button
                        key={run}
                        onClick={() => handleRuns(run)}
                        className={`run-button ${
                          run === 4 ? "four" : run === 6 ? "six" : ""
                        }`}
                      >
                        {run}
                      </button>
                    ))}
                  </div>

                  {/* SIMPLE SPECIALS */}

                  <div className="special-buttons">
                    <button
                      className="special-button wide"
                      onClick={handleWide}
                    >
                      WD
                    </button>

                    <button
                      className="special-button no-ball"
                      onClick={handleNoBall}
                    >
                      NB
                    </button>

                    <button
                      className="special-button wicket"
                      onClick={handleWicket}
                    >
                      WICKET
                    </button>
                  </div>

                  {/* =================================================
                      MANUAL EXCEPTION
                  ================================================= */}

                  <div className="manual-exception-wrapper">
                    <button
                      className="manual-exception-toggle"
                      onClick={() => setShowExceptionPanel((prev) => !prev)}
                    >
                      <ShieldAlert size={18} />

                      <span>Manual Exception Scoring</span>

                      <ChevronDown
                        size={18}
                        className={showExceptionPanel ? "rotate" : ""}
                      />
                    </button>

                    {showExceptionPanel && (
                      <div className="manual-exception-panel">
                        <div className="exception-header">
                          <div>
                            <span className="eyebrow">ADVANCED SCORING</span>

                            <h4>Manual Exception</h4>

                            <p>
                              Record unusual delivery combinations manually.
                            </p>
                          </div>
                        </div>

                        {/* QUICK OPTIONS */}

                        <div className="exception-section">
                          <label>QUICK EXCEPTIONS</label>

                          <div className="exception-quick-grid">
                            <button
                              onClick={() => applyQuickException("NB_W")}
                              className="quick-exception danger"
                            >
                              NB + W
                            </button>

                            <button
                              onClick={() => applyQuickException("NB_4")}
                              className="quick-exception"
                            >
                              NB + 4
                            </button>

                            <button
                              onClick={() => applyQuickException("NB_6")}
                              className="quick-exception"
                            >
                              NB + 6
                            </button>

                            <button
                              onClick={() => applyQuickException("WD_W")}
                              className="quick-exception danger"
                            >
                              WD + W
                            </button>

                            <button
                              onClick={() => applyQuickException("WD_4")}
                              className="quick-exception"
                            >
                              WD + 4
                            </button>

                            <button
                              onClick={() => applyQuickException("WD_6")}
                              className="quick-exception"
                            >
                              WD + 6
                            </button>

                            <button
                              onClick={() => applyQuickException("1_W")}
                              className="quick-exception runout"
                            >
                              1 + W
                            </button>

                            <button
                              onClick={() => applyQuickException("2_W")}
                              className="quick-exception runout"
                            >
                              2 + W
                            </button>

                            <button
                              onClick={() => applyQuickException("3_W")}
                              className="quick-exception runout"
                            >
                              3 + W
                            </button>

                            <button
                              onClick={() => applyQuickException("W")}
                              className="quick-exception danger"
                            >
                              WICKET
                            </button>
                          </div>
                        </div>

                        {/* CUSTOM */}

                        <div className="exception-section">
                          <label>CUSTOM DELIVERY</label>

                          <div className="exception-input-grid">
                            <div className="exception-field">
                              <span>Delivery Type</span>

                              <select
                                value={exceptionType}
                                onChange={(e) =>
                                  setExceptionType(e.target.value)
                                }
                              >
                                <option value="NO_BALL">No Ball</option>

                                <option value="WIDE">Wide</option>

                                <option value="LEGAL_WICKET">
                                  Legal Ball + Wicket
                                </option>

                                <option value="RUN_OUT">Run Out</option>
                              </select>
                            </div>

                            <div className="exception-field">
                              <span>
                                {exceptionType === "WIDE"
                                  ? "Additional Wide Runs"
                                  : "Batsman Runs"}
                              </span>

                              <input
                                type="number"
                                min="0"
                                max="6"
                                value={exceptionRuns}
                                onChange={(e) =>
                                  setExceptionRuns(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>

                          {exceptionType !== "RUN_OUT" && (
                            <label className="exception-checkbox">
                              <input
                                type="checkbox"
                                checked={exceptionWicket}
                                onChange={(e) =>
                                  setExceptionWicket(e.target.checked)
                                }
                              />

                              <span>Wicket on this delivery</span>
                            </label>
                          )}

                          {(exceptionWicket || exceptionType === "RUN_OUT") && (
                            <div className="exception-field wicket-type-field">
                              <span>Wicket Type</span>

                              <select
                                value={exceptionWicketType}
                                onChange={(e) =>
                                  setExceptionWicketType(e.target.value)
                                }
                              >
                                <option value="RUN_OUT">Run Out</option>

                                <option value="STUMPED">Stumped</option>

                                <option value="CAUGHT">Caught</option>

                                <option value="BOWLED">Bowled</option>

                                <option value="LBW">LBW</option>

                                <option value="HIT_WICKET">Hit Wicket</option>

                                <option value="OTHER">Other</option>
                              </select>
                            </div>
                          )}

                          <div className="exception-field">
                            <span>Description</span>

                            <input
                              type="text"
                              value={exceptionDescription}
                              onChange={(e) =>
                                setExceptionDescription(e.target.value)
                              }
                              placeholder="Optional note..."
                            />
                          </div>
                        </div>

                        {/* PREVIEW */}

                        <div className="exception-preview">
                          <div>
                            <span>BALL DISPLAY</span>

                            <strong>{exceptionPreview.label}</strong>
                          </div>

                          <div>
                            <span>TEAM RUNS</span>

                            <strong>+{exceptionPreview.totalRuns}</strong>
                          </div>

                          <div>
                            <span>BATSMAN RUNS</span>

                            <strong>+{exceptionPreview.batsmanRuns}</strong>
                          </div>

                          <div>
                            <span>BALL</span>

                            <strong>
                              {exceptionPreview.legal ? "LEGAL" : "ILLEGAL"}
                            </strong>
                          </div>
                        </div>

                        <button
                          className="record-exception-button"
                          onClick={recordManualException}
                          disabled={saving}
                        >
                          <Save size={17} />
                          Record Exception
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* =================================================
                  HISTORY
              ================================================= */}

              <section className="history-card">
                <div className="history-header">
                  <div>
                    <span className="eyebrow">DELIVERY HISTORY</span>

                    <h3>Recent Balls</h3>
                  </div>

                  <History size={20} />
                </div>

                {history.length === 0 ? (
                  <div className="empty-history">No deliveries recorded.</div>
                ) : (
                  <div className="history-list">
                    {history
                      .slice(-12)
                      .reverse()
                      .map((ball) => (
                        <div key={ball.id} className="history-row">
                          <div className="history-ball">{ball.label}</div>

                          <div className="history-info">
                            <strong>{ball.striker || "Striker"}</strong>

                            <span>{ball.timestamp}</span>
                          </div>

                          <div className="history-runs">+{ball.teamRuns}</div>
                        </div>
                      ))}
                  </div>
                )}

                {canUpdate && history.length > 0 && (
                  <button
                    className="undo-button"
                    onClick={undoLastBall}
                    disabled={saving}
                  >
                    <RotateCcw size={16} />
                    Undo Last Ball
                  </button>
                )}
              </section>

              {/* =================================================
                  INNINGS CONTROLS
              ================================================= */}

              {canUpdate && (
                <section className="match-controls-card">
                  <button
                    className="secondary-action-button"
                    onClick={endFirstInnings}
                    disabled={saving || inningsCompleted}
                  >
                    <Flag size={16} />
                    End First Innings
                  </button>

                  {inningsCompleted && !matchCompleted && (
                    <button
                      className="primary-action-button"
                      onClick={startSecondInnings}
                      disabled={saving}
                    >
                      <Play size={16} />
                      Start Second Innings
                    </button>
                  )}

                  <button
                    className="complete-button"
                    onClick={completeMatch}
                    disabled={saving || matchCompleted}
                  >
                    <Trophy size={16} />
                    Complete Match
                  </button>
                </section>
              )}
            </>
          )}
      </main>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {(loading || saving) && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="loading-spinner" />

            <strong>
              {saving ? "Saving score..." : "Loading scoreboard..."}
            </strong>

            <span>Please wait</span>
          </div>
        </div>
      )}
      <style>{`
/* =========================================================
   CRICKET COMMAND CENTER
   PREMIUM SCOREBOARD UI
========================================================= */

:root {
  --sb-bg: #070a10;
  --sb-bg-2: #0b1018;
  --sb-card: rgba(15, 21, 31, 0.88);
  --sb-card-2: rgba(20, 27, 39, 0.94);
  --sb-border: rgba(255, 255, 255, 0.09);
  --sb-border-light: rgba(255, 255, 255, 0.14);

  --sb-text: #f8fafc;
  --sb-muted: #8d99aa;
  --sb-soft: #b6c0cf;

  --sb-green: #22c55e;
  --sb-green-2: #16a34a;
  --sb-green-soft: rgba(34, 197, 94, 0.14);

  --sb-blue: #38bdf8;
  --sb-blue-soft: rgba(56, 189, 248, 0.14);

  --sb-yellow: #facc15;
  --sb-yellow-soft: rgba(250, 204, 21, 0.14);

  --sb-red: #ef4444;
  --sb-red-soft: rgba(239, 68, 68, 0.14);

  --sb-purple: #a78bfa;
  --sb-purple-soft: rgba(167, 139, 250, 0.14);

  --sb-shadow:
    0 25px 70px rgba(0, 0, 0, 0.38),
    0 5px 20px rgba(0, 0, 0, 0.2);

  --sb-radius: 22px;
}

/* =========================================================
   PAGE
========================================================= */

.scoreboard-page {
  min-height: 100vh;
  color: var(--sb-text);

  background:
    radial-gradient(
      circle at 8% 5%,
      rgba(34, 197, 94, 0.08),
      transparent 28%
    ),
    radial-gradient(
      circle at 92% 12%,
      rgba(56, 189, 248, 0.07),
      transparent 25%
    ),
    radial-gradient(
      circle at 50% 100%,
      rgba(167, 139, 250, 0.05),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      #05070b 0%,
      #080d14 45%,
      #06090f 100%
    );

  position: relative;
  overflow-x: hidden;
  padding-bottom: 60px;

  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.scoreboard-page::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.22;

  background-image:
    linear-gradient(
      rgba(255, 255, 255, 0.018) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.018) 1px,
      transparent 1px
    );

  background-size: 45px 45px;

  mask-image: linear-gradient(
    to bottom,
    black,
    transparent 85%
  );
}

/* =========================================================
   HEADER
========================================================= */

.scoreboard-header {
  position: sticky;
  top: 0;
  z-index: 50;

  min-height: 82px;
  padding: 15px clamp(20px, 4vw, 55px);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  background: rgba(6, 9, 14, 0.82);
  border-bottom: 1px solid var(--sb-border);

  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);

  box-shadow:
    0 10px 35px rgba(0, 0, 0, 0.2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 28px;
  min-width: 0;
}

.back-button {
  height: 42px;

  display: inline-flex;
  align-items: center;
  gap: 9px;

  padding: 0 15px;

  color: #dbe4ef;
  background: rgba(255, 255, 255, 0.045);

  border: 1px solid var(--sb-border);
  border-radius: 12px;

  font-size: 13px;
  font-weight: 700;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.back-button:hover {
  transform: translateX(-2px);

  background: rgba(255, 255, 255, 0.08);
  border-color: var(--sb-border-light);
}

.page-brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.brand-icon {
  width: 46px;
  height: 46px;

  display: grid;
  place-items: center;

  border-radius: 14px;

  color: #fff;

  background:
    linear-gradient(
      135deg,
      #22c55e,
      #15803d
    );

  box-shadow:
    0 8px 30px rgba(34, 197, 94, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.page-brand h1 {
  margin: 0;

  font-size: clamp(18px, 2vw, 22px);
  line-height: 1.15;

  font-weight: 800;
  letter-spacing: -0.03em;
}

.page-brand p {
  margin: 5px 0 0;

  color: var(--sb-muted);

  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-badge {
  min-height: 37px;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 0 13px;

  border-radius: 999px;

  color: #dbeafe;

  background:
    linear-gradient(
      135deg,
      rgba(56, 189, 248, 0.14),
      rgba(167, 139, 250, 0.1)
    );

  border: 1px solid rgba(125, 211, 252, 0.18);

  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.09em;
}

/* =========================================================
   MAIN
========================================================= */

.scoreboard-content {
  position: relative;
  z-index: 2;

  width: min(1280px, calc(100% - 40px));

  margin: 30px auto 0;
}

/* =========================================================
   EYEBROW
========================================================= */

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  color: #7dd3fc;

  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

/* =========================================================
   ERROR
========================================================= */

.error-banner {
  min-height: 54px;

  display: flex;
  align-items: center;
  gap: 12px;

  margin-bottom: 20px;
  padding: 12px 16px;

  color: #fecaca;

  background:
    linear-gradient(
      135deg,
      rgba(127, 29, 29, 0.4),
      rgba(69, 10, 10, 0.55)
    );

  border: 1px solid rgba(248, 113, 113, 0.2);
  border-radius: 15px;

  box-shadow:
    0 15px 35px rgba(127, 29, 29, 0.12);
}

.error-banner span {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
}

.error-banner button {
  width: 32px;
  height: 32px;

  display: grid;
  place-items: center;

  color: #fecaca;
  background: rgba(255, 255, 255, 0.06);

  border: 0;
  border-radius: 9px;

  cursor: pointer;
}

/* =========================================================
   MATCH SELECTOR
========================================================= */

.match-selector-card {
  position: relative;
  overflow: hidden;

  padding: 28px;

  background:
    linear-gradient(
      145deg,
      rgba(18, 25, 37, 0.96),
      rgba(10, 15, 23, 0.96)
    );

  border: 1px solid var(--sb-border);
  border-radius: var(--sb-radius);

  box-shadow: var(--sb-shadow);
}

.match-selector-card::before {
  content: "";

  position: absolute;
  top: -100px;
  right: -80px;

  width: 260px;
  height: 260px;

  border-radius: 50%;

  background:
    radial-gradient(
      circle,
      rgba(34, 197, 94, 0.11),
      transparent 68%
    );

  pointer-events: none;
}

.section-heading {
  position: relative;
  z-index: 1;

  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.section-heading h2 {
  margin: 7px 0 6px;

  font-size: 25px;
  line-height: 1.15;

  letter-spacing: -0.04em;
}

.section-heading p {
  margin: 0;

  max-width: 600px;

  color: var(--sb-muted);

  font-size: 13px;
  line-height: 1.6;
}

.live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 8px 11px;

  color: #86efac;

  background: var(--sb-green-soft);

  border: 1px solid rgba(34, 197, 94, 0.18);
  border-radius: 999px;

  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.live-indicator span {
  width: 7px;
  height: 7px;

  border-radius: 50%;

  background: var(--sb-green);

  box-shadow:
    0 0 0 4px rgba(34, 197, 94, 0.08),
    0 0 16px rgba(34, 197, 94, 0.7);

  animation: livePulse 1.8s infinite;
}

@keyframes livePulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.55;
    transform: scale(0.8);
  }
}

.match-select-wrapper {
  position: relative;
  margin-top: 24px;
}

.match-select-wrapper select {
  width: 100%;
  height: 56px;

  appearance: none;
  -webkit-appearance: none;

  padding: 0 52px 0 17px;

  color: #f8fafc;
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.065),
      rgba(255, 255, 255, 0.025)
    );

  border: 1px solid var(--sb-border-light);
  border-radius: 14px;

  outline: none;

  font-size: 14px;
  font-weight: 700;

  cursor: pointer;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.match-select-wrapper select:hover {
  background: rgba(255, 255, 255, 0.07);
}

.match-select-wrapper select:focus {
  border-color: rgba(34, 197, 94, 0.55);

  box-shadow:
    0 0 0 4px rgba(34, 197, 94, 0.08);
}

.match-select-wrapper select option {
  color: #111827;
  background: #fff;
}

.match-select-wrapper > svg {
  position: absolute;

  right: 17px;
  top: 50%;

  transform: translateY(-50%);

  color: #9ca3af;

  pointer-events: none;
}

/* =========================================================
   EMPTY STATE
========================================================= */

.empty-scoreboard-card {
  margin-top: 22px;
  padding: 70px 30px;

  text-align: center;

  background:
    linear-gradient(
      145deg,
      rgba(17, 24, 36, 0.94),
      rgba(9, 13, 21, 0.94)
    );

  border: 1px solid var(--sb-border);
  border-radius: var(--sb-radius);

  box-shadow: var(--sb-shadow);
}

.empty-icon {
  width: 78px;
  height: 78px;

  margin: 0 auto 20px;

  display: grid;
  place-items: center;

  color: #67e8f9;

  background:
    radial-gradient(
      circle,
      rgba(34, 211, 238, 0.12),
      rgba(34, 211, 238, 0.025)
    );

  border: 1px solid rgba(34, 211, 238, 0.14);
  border-radius: 24px;
}

.empty-scoreboard-card h2 {
  margin: 0 0 8px;

  font-size: 21px;
  letter-spacing: -0.025em;
}

.empty-scoreboard-card p {
  margin: 0;

  color: var(--sb-muted);
  font-size: 13px;
}

/* =========================================================
   START MATCH
========================================================= */

.start-match-card {
  position: relative;

  margin-top: 22px;
  padding: 25px;

  display: flex;
  align-items: center;
  gap: 20px;

  background:
    linear-gradient(
      135deg,
      rgba(15, 30, 23, 0.96),
      rgba(10, 18, 20, 0.96)
    );

  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--sb-radius);

  box-shadow: var(--sb-shadow);
}

.start-match-icon {
  width: 62px;
  height: 62px;

  flex: 0 0 62px;

  display: grid;
  place-items: center;

  color: #86efac;

  background:
    linear-gradient(
      135deg,
      rgba(34, 197, 94, 0.2),
      rgba(22, 163, 74, 0.07)
    );

  border: 1px solid rgba(34, 197, 94, 0.18);
  border-radius: 18px;
}

.start-match-content {
  flex: 1;
}

.start-match-content h2 {
  margin: 6px 0 5px;

  font-size: 21px;
  letter-spacing: -0.03em;
}

.start-match-content h2 span {
  color: var(--sb-muted);
  font-weight: 500;
}

.start-match-content p {
  margin: 0;

  color: var(--sb-muted);
  font-size: 13px;
}

/* =========================================================
   BUTTONS
========================================================= */

.primary-action-button,
.secondary-action-button,
.complete-button,
.undo-button,
.record-exception-button,
.new-bowler-form button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  border: 0;

  font-family: inherit;
  font-size: 12px;
  font-weight: 800;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.primary-action-button {
  min-height: 46px;
  padding: 0 18px;

  color: #04110a;

  background:
    linear-gradient(
      135deg,
      #4ade80,
      #16a34a
    );

  border-radius: 12px;

  box-shadow:
    0 10px 30px rgba(34, 197, 94, 0.18);
}

.primary-action-button:hover {
  transform: translateY(-2px);

  box-shadow:
    0 15px 35px rgba(34, 197, 94, 0.28);
}

.secondary-action-button {
  min-height: 43px;
  padding: 0 15px;

  color: #dbeafe;

  background: rgba(255, 255, 255, 0.055);

  border: 1px solid var(--sb-border-light);
  border-radius: 11px;
}

.secondary-action-button:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.09);
}

.complete-button {
  min-height: 43px;
  padding: 0 17px;

  color: #fff;

  background:
    linear-gradient(
      135deg,
      #ef4444,
      #b91c1c
    );

  border-radius: 11px;

  box-shadow:
    0 10px 25px rgba(239, 68, 68, 0.14);
}

.complete-button:hover {
  transform: translateY(-1px);

  box-shadow:
    0 15px 30px rgba(239, 68, 68, 0.22);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none !important;
}

/* =========================================================
   COMPLETED MATCH
========================================================= */

.completed-match-card {
  margin-top: 22px;
  padding: 27px;

  display: flex;
  align-items: center;
  gap: 20px;

  background:
    linear-gradient(
      135deg,
      rgba(35, 29, 10, 0.94),
      rgba(20, 17, 10, 0.96)
    );

  border: 1px solid rgba(250, 204, 21, 0.17);
  border-radius: var(--sb-radius);

  box-shadow: var(--sb-shadow);
}

.completed-icon {
  width: 62px;
  height: 62px;

  display: grid;
  place-items: center;

  color: #fde68a;

  background:
    linear-gradient(
      135deg,
      rgba(250, 204, 21, 0.16),
      rgba(180, 83, 9, 0.08)
    );

  border: 1px solid rgba(250, 204, 21, 0.17);
  border-radius: 18px;
}

.completed-match-card > div:nth-child(2) {
  flex: 1;
}

.completed-match-card h2 {
  margin: 5px 0;

  font-size: 21px;
  letter-spacing: -0.03em;
}

.completed-match-card h2 span {
  color: var(--sb-muted);
  font-weight: 500;
}

.completed-match-card p {
  margin: 0;

  color: var(--sb-muted);
  font-size: 13px;
}

/* =========================================================
   SCORE HERO
========================================================= */

.score-hero {
  position: relative;
  overflow: hidden;

  margin-top: 22px;
  padding: 30px;

  background:
    radial-gradient(
      circle at 80% 15%,
      rgba(34, 197, 94, 0.12),
      transparent 32%
    ),
    linear-gradient(
      145deg,
      #111b19,
      #0a1215 60%,
      #081014
    );

  border: 1px solid rgba(34, 197, 94, 0.17);
  border-radius: 26px;

  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.035);
}

.score-hero::after {
  content: "";

  position: absolute;
  width: 320px;
  height: 320px;

  right: -150px;
  bottom: -190px;

  border-radius: 50%;

  border: 1px solid rgba(34, 197, 94, 0.1);

  box-shadow:
    0 0 0 30px rgba(34, 197, 94, 0.018),
    0 0 0 60px rgba(34, 197, 94, 0.012);

  pointer-events: none;
}

.score-hero-top {
  position: relative;
  z-index: 1;

  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 25px;
}

.score-hero-top .eyebrow {
  color: #86efac;
}

.score-hero h2 {
  margin: 8px 0 0;

  font-size: clamp(58px, 8vw, 92px);

  line-height: 0.92;

  letter-spacing: -0.075em;
  font-weight: 900;

  font-variant-numeric: tabular-nums;

  text-shadow:
    0 8px 30px rgba(0, 0, 0, 0.25);
}

.score-hero h2 span {
  margin: 0 6px;

  color: rgba(255, 255, 255, 0.25);
  font-weight: 500;
}

.score-hero-top p {
  margin: 13px 0 0;

  color: #9ca3af;

  font-size: 13px;
  font-weight: 700;
}

.target-box {
  min-width: 135px;

  padding: 16px 18px;

  text-align: right;

  background: rgba(255, 255, 255, 0.045);

  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 16px;
}

.target-box span {
  display: block;

  color: #7c8797;

  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.17em;
}

.target-box strong {
  display: block;

  margin-top: 5px;

  color: #f8fafc;

  font-size: 27px;
  line-height: 1;

  font-variant-numeric: tabular-nums;
}

.score-meta {
  position: relative;
  z-index: 2;

  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  margin-top: 30px;
}

.score-meta div {
  min-height: 36px;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 0 12px;

  color: #aeb9c7;

  background: rgba(255, 255, 255, 0.04);

  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;

  font-size: 11px;
  font-weight: 700;
}

.score-meta svg {
  color: #67e8f9;
}

/* =========================================================
   LAST ACTION
========================================================= */

.last-action {
  margin-top: 15px;
  padding: 13px 16px;

  display: flex;
  align-items: center;
  gap: 10px;

  color: #bbf7d0;

  background:
    linear-gradient(
      90deg,
      rgba(34, 197, 94, 0.11),
      rgba(34, 197, 94, 0.025)
    );

  border: 1px solid rgba(34, 197, 94, 0.12);
  border-radius: 13px;

  font-size: 12px;
  font-weight: 700;
}

.last-action svg {
  color: #4ade80;
}

/* =========================================================
   NEW BOWLER
========================================================= */

.new-bowler-card {
  margin-top: 18px;
  padding: 20px;

  display: flex;
  align-items: center;
  gap: 17px;

  background:
    linear-gradient(
      135deg,
      rgba(56, 189, 248, 0.075),
      rgba(14, 23, 38, 0.92)
    );

  border: 1px solid rgba(56, 189, 248, 0.13);
  border-radius: 18px;

  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.2);
}

.new-bowler-icon {
  width: 50px;
  height: 50px;

  flex: 0 0 50px;

  display: grid;
  place-items: center;

  color: #7dd3fc;

  background: rgba(56, 189, 248, 0.09);

  border: 1px solid rgba(56, 189, 248, 0.14);
  border-radius: 14px;
}

.new-bowler-text {
  flex: 1;
}

.new-bowler-text h3 {
  margin: 4px 0;

  font-size: 17px;
}

.new-bowler-text p {
  margin: 0;

  color: var(--sb-muted);
  font-size: 12px;
}

.new-bowler-form {
  display: flex;
  gap: 9px;
}

.new-bowler-form input {
  width: 220px;
}

/* =========================================================
   INPUTS
========================================================= */

.scoreboard-page input,
.scoreboard-page select {
  box-sizing: border-box;

  color: #f8fafc;

  background:
    rgba(255, 255, 255, 0.045);

  border: 1px solid rgba(255, 255, 255, 0.1);

  outline: none;

  font-family: inherit;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.scoreboard-page input:focus,
.scoreboard-page select:focus {
  border-color: rgba(56, 189, 248, 0.45);

  background: rgba(255, 255, 255, 0.065);

  box-shadow:
    0 0 0 4px rgba(56, 189, 248, 0.07);
}

.scoreboard-page input::placeholder {
  color: #667386;
}

/* =========================================================
   PLAYERS
========================================================= */

.players-grid {
  margin-top: 18px;

  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1fr)
    minmax(0, 1fr);

  gap: 15px;
}

.player-card {
  position: relative;
  overflow: hidden;

  min-height: 205px;

  padding: 20px;

  background:
    linear-gradient(
      145deg,
      rgba(17, 24, 36, 0.94),
      rgba(9, 14, 22, 0.94)
    );

  border: 1px solid var(--sb-border);
  border-radius: 19px;

  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.22);

  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.player-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.13);
}

.striker-card {
  border-color: rgba(34, 197, 94, 0.18);

  background:
    radial-gradient(
      circle at 100% 0%,
      rgba(34, 197, 94, 0.1),
      transparent 38%
    ),
    linear-gradient(
      145deg,
      rgba(17, 28, 23, 0.95),
      rgba(9, 15, 19, 0.95)
    );
}

.bowler-card {
  background:
    radial-gradient(
      circle at 100% 0%,
      rgba(56, 189, 248, 0.07),
      transparent 40%
    ),
    linear-gradient(
      145deg,
      rgba(17, 24, 36, 0.94),
      rgba(9, 14, 22, 0.94)
    );
}

.player-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.player-role {
  color: #718096;

  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.17em;
}

.batting-dot {
  width: 8px;
  height: 8px;

  border-radius: 50%;

  background: var(--sb-green);

  box-shadow:
    0 0 0 5px rgba(34, 197, 94, 0.07),
    0 0 14px rgba(34, 197, 94, 0.6);
}

.player-name {
  display: flex;
  align-items: center;
  gap: 9px;

  margin-top: 20px;
}

.player-name svg {
  flex: 0 0 auto;
  color: #7dd3fc;
}

.player-name input {
  min-width: 0;
  width: 100%;

  height: 39px;

  padding: 0 11px;

  border-radius: 10px;

  font-size: 13px;
  font-weight: 700;
}

.player-stat {
  display: flex;
  align-items: baseline;
  gap: 7px;

  margin-top: 19px;
}

.player-stat strong {
  font-size: 35px;
  line-height: 1;

  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;
}

.player-stat span {
  color: #7f8a9a;

  font-size: 12px;
  font-weight: 700;
}

.player-mini-stats {
  display: flex;
  gap: 8px;

  margin-top: 17px;
}

.player-mini-stats span {
  padding: 7px 10px;

  color: #8f9aaa;

  background: rgba(255, 255, 255, 0.035);

  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;

  font-size: 10px;
  font-weight: 700;
}

.player-mini-stats strong {
  margin-left: 4px;
  color: #f8fafc;
}

.bowler-stat-line {
  margin-top: 25px;

  display: flex;
  align-items: baseline;
  gap: 7px;

  flex-wrap: wrap;
}

.bowler-stat-line strong {
  color: #f8fafc;

  font-size: 32px;
  line-height: 1;

  font-variant-numeric: tabular-nums;
}

.bowler-stat-line span {
  color: #7e8999;

  margin-right: 10px;

  font-size: 11px;
  font-weight: 700;
}

/* =========================================================
   CURRENT OVER
========================================================= */

.current-over-card {
  margin-top: 18px;
  padding: 22px;

  background:
    linear-gradient(
      145deg,
      rgba(17, 24, 36, 0.96),
      rgba(9, 14, 22, 0.96)
    );

  border: 1px solid var(--sb-border);
  border-radius: 20px;

  box-shadow: var(--sb-shadow);
}

.current-over-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-over-header h3 {
  margin: 5px 0 0;

  font-size: 18px;
  letter-spacing: -0.025em;
}

.over-number {
  padding: 8px 11px;

  color: #c4b5fd;

  background: var(--sb-purple-soft);

  border: 1px solid rgba(167, 139, 250, 0.15);
  border-radius: 9px;

  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.current-over-balls {
  min-height: 72px;

  margin-top: 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  overflow-x: auto;
  padding-bottom: 4px;
}

.current-over-balls::-webkit-scrollbar {
  height: 4px;
}

.current-over-balls::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 99px;
}

.empty-over {
  width: 100%;

  display: grid;
  place-items: center;

  min-height: 62px;

  color: #677386;

  background: rgba(255, 255, 255, 0.025);

  border: 1px dashed rgba(255, 255, 255, 0.09);
  border-radius: 13px;

  font-size: 11px;
  font-weight: 700;
}

.ball-result {
  position: relative;

  width: 54px;
  height: 54px;

  flex: 0 0 54px;

  display: grid;
  place-items: center;

  color: #d9e2ed;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.07),
      rgba(255, 255, 255, 0.025)
    );

  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;

  font-size: 12px;

  box-shadow:
    0 7px 18px rgba(0, 0, 0, 0.2);
}

.ball-result strong {
  font-weight: 900;
  white-space: nowrap;
}

.ball-extra {
  color: #fde68a;

  background:
    radial-gradient(
      circle,
      rgba(250, 204, 21, 0.13),
      rgba(250, 204, 21, 0.025)
    );

  border-color: rgba(250, 204, 21, 0.23);
}

.ball-wicket {
  color: #fecaca;

  background:
    radial-gradient(
      circle,
      rgba(239, 68, 68, 0.17),
      rgba(127, 29, 29, 0.035)
    );

  border-color: rgba(239, 68, 68, 0.3);

  box-shadow:
    0 8px 24px rgba(239, 68, 68, 0.12);
}

.ball-wicket-mark {
  position: absolute;

  right: -2px;
  top: -3px;

  width: 17px;
  height: 17px;

  display: grid;
  place-items: center;

  color: white;

  background: #dc2626;

  border: 2px solid #0d131c;
  border-radius: 50%;

  font-size: 7px;
  font-weight: 900;
}

.over-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 17px;

  margin-top: 16px;
}

.over-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  color: #768294;

  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.legend-dot {
  width: 6px;
  height: 6px;

  display: inline-block;

  border-radius: 50%;
}

.legend-dot.legal {
  background: #64748b;
}

.legend-dot.extra {
  background: #facc15;
}

.legend-dot.wicket {
  background: #ef4444;
}

/* =========================================================
   SCORING CARD
========================================================= */

.scoring-card {
  margin-top: 18px;
  padding: 25px;

  background:
    linear-gradient(
      145deg,
      rgba(18, 26, 38, 0.97),
      rgba(9, 14, 22, 0.97)
    );

  border: 1px solid rgba(56, 189, 248, 0.1);
  border-radius: 22px;

  box-shadow: var(--sb-shadow);
}

.scoring-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.scoring-header h3 {
  margin: 5px 0 0;

  font-size: 19px;
  letter-spacing: -0.025em;
}

.selected-run {
  padding: 8px 12px;

  color: #94a3b8;

  background: rgba(255, 255, 255, 0.045);

  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;

  font-size: 10px;
  font-weight: 800;
}

.selected-run strong {
  margin-left: 5px;

  color: #f8fafc;

  font-size: 15px;
}

/* =========================================================
   RUN BUTTONS
========================================================= */

.run-buttons {
  display: grid;

  grid-template-columns:
    repeat(6, minmax(0, 1fr));

  gap: 10px;

  margin-top: 23px;
}

.run-button {
  height: 64px;

  display: grid;
  place-items: center;

  color: #f8fafc;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.075),
      rgba(255, 255, 255, 0.025)
    );

  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;

  font-family: inherit;

  font-size: 20px;
  font-weight: 900;

  cursor: pointer;

  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.17);

  transition:
    transform 0.16s ease,
    background 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.run-button:hover {
  transform: translateY(-3px);

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.12),
      rgba(255, 255, 255, 0.045)
    );

  border-color: rgba(255, 255, 255, 0.17);

  box-shadow:
    0 13px 28px rgba(0, 0, 0, 0.25);
}

.run-button:active {
  transform: translateY(1px) scale(0.98);
}

.run-button.dot {
  color: #94a3b8;
}

.run-button.four {
  color: #67e8f9;

  background:
    linear-gradient(
      145deg,
      rgba(34, 211, 238, 0.11),
      rgba(34, 211, 238, 0.025)
    );

  border-color: rgba(34, 211, 238, 0.18);
}

.run-button.six {
  color: #c4b5fd;

  background:
    linear-gradient(
      145deg,
      rgba(167, 139, 250, 0.13),
      rgba(167, 139, 250, 0.025)
    );

  border-color: rgba(167, 139, 250, 0.2);
}

/* =========================================================
   SPECIAL BUTTONS
========================================================= */

.special-buttons {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 10px;

  margin-top: 12px;
}

.special-button {
  min-height: 53px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: 13px;

  font-family: inherit;

  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;

  cursor: pointer;

  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.special-button:hover {
  transform: translateY(-2px);
}

.special-button.wide {
  color: #fde68a;

  background:
    linear-gradient(
      135deg,
      rgba(250, 204, 21, 0.13),
      rgba(250, 204, 21, 0.035)
    );

  border: 1px solid rgba(250, 204, 21, 0.18);
}

.special-button.no-ball {
  color: #93c5fd;

  background:
    linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.13),
      rgba(59, 130, 246, 0.035)
    );

  border: 1px solid rgba(59, 130, 246, 0.18);
}

.special-button.wicket {
  color: #fecaca;

  background:
    linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.16),
      rgba(127, 29, 29, 0.05)
    );

  border: 1px solid rgba(239, 68, 68, 0.2);

  box-shadow:
    0 8px 24px rgba(239, 68, 68, 0.08);
}

/* =========================================================
   MANUAL EXCEPTION
========================================================= */

.manual-exception-wrapper {
  margin-top: 20px;

  border: 1px solid rgba(167, 139, 250, 0.12);
  border-radius: 16px;

  background:
    rgba(167, 139, 250, 0.025);

  overflow: hidden;
}

.manual-exception-toggle {
  width: 100%;
  min-height: 55px;

  display: flex;
  align-items: center;
  gap: 10px;

  padding: 0 16px;

  color: #c4b5fd;

  background: transparent;

  border: 0;

  font-family: inherit;

  font-size: 12px;
  font-weight: 800;

  text-align: left;

  cursor: pointer;
}

.manual-exception-toggle svg:first-child {
  color: #a78bfa;
}

.manual-exception-toggle svg:last-child {
  margin-left: auto;

  transition: transform 0.25s ease;
}

.manual-exception-toggle .rotate {
  transform: rotate(180deg);
}

.manual-exception-toggle:hover {
  background: rgba(167, 139, 250, 0.045);
}

.manual-exception-panel {
  padding: 22px;

  border-top: 1px solid rgba(167, 139, 250, 0.1);

  background:
    linear-gradient(
      180deg,
      rgba(15, 19, 29, 0.9),
      rgba(10, 14, 21, 0.96)
    );
}

.exception-header h4 {
  margin: 6px 0 5px;

  font-size: 18px;
  letter-spacing: -0.025em;
}

.exception-header p {
  margin: 0;

  color: var(--sb-muted);

  font-size: 12px;
}

.exception-section {
  margin-top: 22px;
}

.exception-section > label {
  display: block;

  margin-bottom: 10px;

  color: #738093;

  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.15em;
}

.exception-quick-grid {
  display: grid;

  grid-template-columns:
    repeat(5, minmax(0, 1fr));

  gap: 9px;
}

.quick-exception {
  min-height: 46px;

  color: #d8e1ed;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.025)
    );

  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 11px;

  font-family: inherit;

  font-size: 11px;
  font-weight: 900;

  cursor: pointer;

  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;
}

.quick-exception:hover {
  transform: translateY(-2px);

  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.quick-exception.danger {
  color: #fecaca;

  background:
    rgba(239, 68, 68, 0.075);

  border-color:
    rgba(239, 68, 68, 0.16);
}

.quick-exception.runout {
  color: #fde68a;

  background:
    rgba(250, 204, 21, 0.055);

  border-color:
    rgba(250, 204, 21, 0.13);
}

/* =========================================================
   EXCEPTION FORM
========================================================= */

.exception-input-grid {
  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 12px;
}

.exception-field {
  display: flex;
  flex-direction: column;
  gap: 7px;

  margin-top: 13px;
}

.exception-input-grid .exception-field {
  margin-top: 0;
}

.exception-field > span {
  color: #8792a3;

  font-size: 10px;
  font-weight: 800;
}

.exception-field input,
.exception-field select {
  width: 100%;
  min-height: 44px;

  padding: 0 12px;

  border-radius: 10px;

  font-size: 12px;
  font-weight: 700;
}

.exception-field select {
  appearance: auto;
}

.exception-checkbox {
  margin-top: 15px;

  display: flex;
  align-items: center;
  gap: 9px;

  color: #aeb8c6;

  font-size: 11px;
  font-weight: 700;

  cursor: pointer;
}

.exception-checkbox input {
  width: 16px;
  height: 16px;

  accent-color: #22c55e;

  cursor: pointer;
}

.wicket-type-field {
  max-width: 50%;
}

.exception-preview {
  margin-top: 20px;
  padding: 15px;

  display: grid;

  grid-template-columns:
    1.4fr
    repeat(3, 1fr);

  gap: 8px;

  background:
    rgba(255, 255, 255, 0.03);

  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 13px;
}

.exception-preview > div {
  min-width: 0;

  padding: 10px;

  background: rgba(255, 255, 255, 0.025);

  border-radius: 9px;
}

.exception-preview span {
  display: block;

  color: #687487;

  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.exception-preview strong {
  display: block;

  margin-top: 5px;

  color: #f8fafc;

  font-size: 14px;
  font-weight: 900;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-exception-button {
  width: 100%;
  min-height: 48px;

  margin-top: 12px;

  color: #fff;

  background:
    linear-gradient(
      135deg,
      #7c3aed,
      #5b21b6
    );

  border-radius: 11px;

  box-shadow:
    0 10px 28px rgba(124, 58, 237, 0.16);
}

.record-exception-button:hover {
  transform: translateY(-2px);

  box-shadow:
    0 15px 34px rgba(124, 58, 237, 0.24);
}

/* =========================================================
   HISTORY
========================================================= */

.history-card {
  margin-top: 18px;
  padding: 22px;

  background:
    linear-gradient(
      145deg,
      rgba(17, 24, 36, 0.95),
      rgba(9, 14, 22, 0.95)
    );

  border: 1px solid var(--sb-border);
  border-radius: 20px;

  box-shadow: var(--sb-shadow);
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-header h3 {
  margin: 5px 0 0;

  font-size: 18px;
}

.history-header > svg {
  color: #64748b;
}

.empty-history {
  margin-top: 18px;
  padding: 25px;

  text-align: center;

  color: #677386;

  background: rgba(255, 255, 255, 0.025);

  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 12px;

  font-size: 11px;
  font-weight: 700;
}

.history-list {
  margin-top: 17px;

  display: flex;
  flex-direction: column;

  gap: 7px;
}

.history-row {
  min-height: 54px;

  display: flex;
  align-items: center;
  gap: 13px;

  padding: 7px 10px;

  background:
    rgba(255, 255, 255, 0.028);

  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 11px;
}

.history-row:hover {
  background: rgba(255, 255, 255, 0.045);
}

.history-ball {
  width: 39px;
  height: 39px;

  flex: 0 0 39px;

  display: grid;
  place-items: center;

  color: #f8fafc;

  background:
    linear-gradient(
      145deg,
      rgba(56, 189, 248, 0.12),
      rgba(56, 189, 248, 0.025)
    );

  border: 1px solid rgba(56, 189, 248, 0.12);
  border-radius: 10px;

  font-size: 10px;
  font-weight: 900;
}

.history-info {
  min-width: 0;

  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 3px;
}

.history-info strong {
  color: #dbe4ee;

  font-size: 12px;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-info span {
  color: #657183;

  font-size: 9px;
  font-weight: 700;
}

.history-runs {
  color: #86efac;

  font-size: 12px;
  font-weight: 900;
}

.undo-button {
  width: 100%;
  min-height: 43px;

  margin-top: 13px;

  color: #fbbf24;

  background:
    rgba(245, 158, 11, 0.07);

  border: 1px solid rgba(245, 158, 11, 0.13);
  border-radius: 10px;
}

.undo-button:hover {
  transform: translateY(-1px);

  background:
    rgba(245, 158, 11, 0.11);
}

/* =========================================================
   MATCH CONTROLS
========================================================= */

.match-controls-card {
  margin-top: 18px;
  padding: 17px;

  display: flex;
  justify-content: flex-end;
  gap: 10px;

  background:
    rgba(11, 16, 24, 0.9);

  border: 1px solid var(--sb-border);
  border-radius: 18px;

  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.2);
}

/* =========================================================
   LOADING
========================================================= */

.loading-overlay {
  position: fixed;
  inset: 0;

  z-index: 100;

  display: grid;
  place-items: center;

  padding: 20px;

  background:
    rgba(3, 6, 10, 0.66);

  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.loading-card {
  min-width: 220px;

  padding: 25px;

  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 8px;

  text-align: center;

  background:
    linear-gradient(
      145deg,
      rgba(20, 27, 39, 0.97),
      rgba(9, 14, 22, 0.98)
    );

  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;

  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.5);
}

.loading-spinner {
  width: 38px;
  height: 38px;

  margin-bottom: 5px;

  border-radius: 50%;

  border:
    3px solid rgba(255, 255, 255, 0.09);

  border-top-color: #22c55e;

  animation:
    spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-card strong {
  color: #f8fafc;

  font-size: 13px;
}

.loading-card span {
  color: #697587;

  font-size: 10px;
  font-weight: 700;
}

/* =========================================================
   SCROLLBAR
========================================================= */

.scoreboard-page::-webkit-scrollbar {
  width: 9px;
}

.scoreboard-page::-webkit-scrollbar-track {
  background: #06090e;
}

.scoreboard-page::-webkit-scrollbar-thumb {
  background:
    linear-gradient(
      #263242,
      #151e2b
    );

  border-radius: 20px;

  border: 2px solid #06090e;
}

.scoreboard-page::-webkit-scrollbar-thumb:hover {
  background: #344154;
}

/* =========================================================
   RESPONSIVE - TABLET
========================================================= */

@media (max-width: 950px) {
  .scoreboard-content {
    width: min(100% - 28px, 760px);
  }

  .players-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .bowler-card {
    grid-column: span 2;
  }

  .exception-quick-grid {
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
  }

  .run-buttons {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }
}

/* =========================================================
   RESPONSIVE - MOBILE
========================================================= */

@media (max-width: 700px) {
  .scoreboard-header {
    position: relative;

    padding: 14px 16px;

    align-items: flex-start;
  }

  .header-left {
    gap: 12px;
  }

  .back-button {
    width: 42px;
    padding: 0;

    justify-content: center;

    font-size: 0;
  }

  .back-button svg {
    margin: 0;
  }

  .page-brand h1 {
    font-size: 17px;
  }

  .page-brand p {
    font-size: 8px;
  }

  .brand-icon {
    width: 40px;
    height: 40px;
  }

  .role-badge {
    padding: 0 9px;

    font-size: 9px;
  }

  .role-badge svg {
    display: none;
  }

  .scoreboard-content {
    width: calc(100% - 20px);
    margin-top: 16px;
  }

  .match-selector-card,
  .score-hero,
  .scoring-card,
  .current-over-card,
  .history-card {
    padding: 18px;
  }

  .section-heading {
    flex-direction: column;
  }

  .live-indicator {
    align-self: flex-start;
  }

  .score-hero-top {
    flex-direction: column;
  }

  .target-box {
    width: 100%;
    box-sizing: border-box;

    display: flex;
    justify-content: space-between;
    align-items: center;

    text-align: left;
  }

  .target-box strong {
    margin: 0;
  }

  .score-meta {
    gap: 7px;
  }

  .score-meta div {
    flex: 1;
    justify-content: center;
  }

  .start-match-card,
  .completed-match-card,
  .new-bowler-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .start-match-content {
    width: 100%;
  }

  .primary-action-button,
  .secondary-action-button,
  .complete-button {
    width: 100%;
  }

  .new-bowler-form {
    width: 100%;
    flex-direction: column;
  }

  .new-bowler-form input {
    width: 100%;
  }

  .new-bowler-form button {
    width: 100%;
    min-height: 44px;
  }

  .players-grid {
    grid-template-columns: 1fr;
  }

  .bowler-card {
    grid-column: auto;
  }

  .exception-quick-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .exception-input-grid {
    grid-template-columns: 1fr;
  }

  .wicket-type-field {
    max-width: 100%;
  }

  .exception-preview {
    grid-template-columns:
      1fr 1fr;
  }

  .exception-preview > div:first-child {
    grid-column: span 2;
  }

  .match-controls-card {
    flex-direction: column;
  }

  .match-controls-card button {
    width: 100%;
  }
}

/* =========================================================
   SMALL MOBILE
========================================================= */

@media (max-width: 430px) {
  .page-brand p {
    display: none;
  }

  .score-hero h2 {
    font-size: 56px;
  }

  .score-meta {
    display: grid;

    grid-template-columns:
      1fr 1fr;
  }

  .score-meta div:last-child {
    grid-column: span 2;
  }

  .run-buttons {
    grid-template-columns:
      repeat(3, 1fr);

    gap: 8px;
  }

  .run-button {
    height: 58px;
  }

  .special-buttons {
    grid-template-columns: 1fr;
  }

  .exception-preview {
    grid-template-columns: 1fr;
  }

  .exception-preview > div:first-child {
    grid-column: auto;
  }

  .history-row {
    gap: 9px;
  }
}

/* =========================================================
   REDUCED MOTION
========================================================= */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`}</style>
    </div>
  );
}

// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   ArrowLeft,
//   Check,
//   ChevronDown,
//   CircleDot,
//   Clock,
//   Edit3,
//   History,
//   Lock,
//   Play,
//   RotateCcw,
//   ShieldAlert,
//   Trophy,
//   User,
//   Users,
//   X,
//   Zap,
// } from "lucide-react";

// import { inningsAPI, matchAPI, scoreAPI } from "../services/api";

// // ============================================================
// // HELPERS
// // ============================================================

// const getStoredRole = () => {
//   try {
//     const user = JSON.parse(localStorage.getItem("user") || "{}");

//     return String(
//       user?.role || user?.authorities?.[0]?.authority || user?.roles?.[0] || "",
//     )
//       .replace("ROLE_", "")
//       .toUpperCase();
//   } catch {
//     return "";
//   }
// };

// const canManageScores = () => {
//   const role = getStoredRole();

//   return ["ADMIN", "ORGANIZER", "SCORER"].includes(role);
// };

// const emptyBatsman = () => ({
//   name: "",
//   runs: 0,
//   balls: 0,
//   fours: 0,
//   sixes: 0,
// });

// const emptyBowler = () => ({
//   name: "",
//   runs: 0,
//   wickets: 0,
//   balls: 0,
// });

// const emptyScore = () => ({
//   runs: 0,
//   wickets: 0,
//   overs: 0,
//   balls: 0,
//   target: null,
//   striker: emptyBatsman(),
//   nonStriker: emptyBatsman(),
//   bowler: emptyBowler(),
// });

// const normalizeResponse = (response) => {
//   if (response?.data !== undefined) {
//     return response.data;
//   }

//   return response;
// };

// const getMatchId = (match) => {
//   return (
//     match?.id ?? match?.matchId ?? match?.matchID ?? match?.match?.id ?? null
//   );
// };

// const getTeamName = (team) => {
//   if (!team) return "Unknown Team";

//   return team?.name || team?.teamName || team?.shortName || "Unknown Team";
// };

// const getTeam1Name = (match) => {
//   return getTeamName(match?.team1) || match?.team1Name || "Team 1";
// };

// const getTeam2Name = (match) => {
//   return getTeamName(match?.team2) || match?.team2Name || "Team 2";
// };

// const getMatchStatus = (match) => {
//   return String(match?.status || "SCHEDULED").toUpperCase();
// };

// const getCurrentInningsNumber = (innings) => {
//   return Number(
//     innings?.inningsNumber ?? innings?.number ?? innings?.innings ?? 1,
//   );
// };

// const formatOvers = (balls = 0) => {
//   const numericBalls = Number(balls || 0);

//   return `${Math.floor(numericBalls / 6)}.${numericBalls % 6}`;
// };

// // ============================================================
// // COMPONENT
// // ============================================================

// export default function Scoreboard() {
//   const navigate = useNavigate();

//   // ----------------------------------------------------------
//   // MATCH
//   // ----------------------------------------------------------

//   const [matches, setMatches] = useState([]);
//   const [selectedMatch, setSelectedMatch] = useState(null);
//   const [matchId, setMatchId] = useState(null);

//   // ----------------------------------------------------------
//   // UI
//   // ----------------------------------------------------------

//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const [lastAction, setLastAction] = useState("");

//   // ----------------------------------------------------------
//   // SCORE
//   // ----------------------------------------------------------

//   const [score, setScore] = useState(emptyScore());

//   const [strikerName, setStrikerName] = useState("");
//   const [nonStrikerName, setNonStrikerName] = useState("");
//   const [bowlerName, setBowlerName] = useState("");
//   const [nextBowlerName, setNextBowlerName] = useState("");

//   // ----------------------------------------------------------
//   // BALLS / HISTORY
//   // ----------------------------------------------------------

//   const [currentOverBalls, setCurrentOverBalls] = useState([]);
//   const [history, setHistory] = useState([]);

//   const [selectedRuns, setSelectedRuns] = useState(null);

//   // ----------------------------------------------------------
//   // MATCH STATE
//   // ----------------------------------------------------------

//   const [inningsCompleted, setInningsCompleted] = useState(false);
//   const [matchCompleted, setMatchCompleted] = useState(false);
//   const [bowlerChangeRequired, setBowlerChangeRequired] = useState(false);
//   const [showCompletedMatchList, setShowCompletedMatchList] = useState(false);

//   // ----------------------------------------------------------
//   // MANUAL EXCEPTION STATE
//   // ----------------------------------------------------------

//   const [showExceptionPanel, setShowExceptionPanel] = useState(false);

//   const [exceptionType, setExceptionType] = useState("NO_BALL");

//   const [exceptionRuns, setExceptionRuns] = useState(0);

//   const [exceptionWicket, setExceptionWicket] = useState(false);

//   const [exceptionDescription, setExceptionDescription] = useState("");

//   const canUpdate = useMemo(() => canManageScores(), []);

//   // ==========================================================
//   // EXCEPTION CALCULATIONS
//   // ==========================================================

//   const getExceptionPreview = () => {
//     const runs = Math.max(0, Number(exceptionRuns || 0));

//     let teamRuns = 0;
//     let batsmanRuns = 0;
//     let legalBall = true;
//     let label = "";

//     if (exceptionType === "NO_BALL") {
//       teamRuns = 1 + runs;
//       batsmanRuns = runs;
//       legalBall = false;

//       label = runs > 0 ? `NB + ${runs}` : "NB";
//     }

//     if (exceptionType === "WIDE") {
//       teamRuns = 1 + runs;
//       batsmanRuns = 0;
//       legalBall = false;

//       label = runs > 0 ? `WD + ${runs}` : "WD";
//     }

//     if (exceptionType === "LEGAL_WICKET") {
//       teamRuns = runs;
//       batsmanRuns = runs;
//       legalBall = true;

//       label = exceptionWicket ? (runs > 0 ? `${runs} + W` : "W") : `${runs}`;
//     }

//     return {
//       teamRuns,
//       batsmanRuns,
//       legalBall,
//       label,
//     };
//   };

//   const exceptionPreview = getExceptionPreview();

//   // ==========================================================
//   // LOAD MATCHES
//   // ==========================================================

//   const loadMatches = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await matchAPI.getAll();

//       const data = normalizeResponse(response);

//       const list = Array.isArray(data)
//         ? data
//         : Array.isArray(data?.content)
//           ? data.content
//           : Array.isArray(data?.matches)
//             ? data.matches
//             : [];

//       setMatches(list);
//     } catch (err) {
//       console.error("LOAD MATCHES ERROR:", err);

//       setError(
//         err?.response?.data?.message ||
//           err?.response?.data?.error ||
//           err?.message ||
//           "Unable to load matches.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadMatches();
//   }, []);

//   // ==========================================================
//   // RESET
//   // ==========================================================

//   const resetScoreboardUI = () => {
//     setScore(emptyScore());

//     setStrikerName("");
//     setNonStrikerName("");
//     setBowlerName("");
//     setNextBowlerName("");

//     setCurrentOverBalls([]);
//     setHistory([]);

//     setSelectedRuns(null);

//     setInningsCompleted(false);
//     setMatchCompleted(false);
//     setBowlerChangeRequired(false);

//     setShowExceptionPanel(false);

//     setExceptionType("NO_BALL");
//     setExceptionRuns(0);
//     setExceptionWicket(false);
//     setExceptionDescription("");

//     setLastAction("");
//     setError("");
//   };

//   // ==========================================================
//   // INITIALIZE MATCH
//   // ==========================================================

//   const initializeMatch = async (match) => {
//     const id = getMatchId(match);

//     if (!id) {
//       setError("Invalid match selected.");
//       return;
//     }

//     try {
//       setLoading(true);
//       setError("");

//       resetScoreboardUI();

//       setSelectedMatch(match);
//       setMatchId(id);

//       const status = getMatchStatus(match);

//       if (status === "COMPLETED") {
//         setMatchCompleted(true);
//       }

//       if (status === "LIVE" || status === "IN_PROGRESS") {
//         try {
//           const scoreResponse = await scoreAPI.getCurrent(id);

//           const currentScore = normalizeResponse(scoreResponse) || {};

//           const normalizedScore = {
//             runs: Number(currentScore?.runs ?? currentScore?.score ?? 0),

//             wickets: Number(currentScore?.wickets ?? 0),

//             overs: Number(currentScore?.overs ?? 0),

//             balls: Number(
//               currentScore?.balls ??
//                 Math.round(Number(currentScore?.overs || 0) * 6),
//             ),

//             target:
//               currentScore?.target != null ? Number(currentScore.target) : null,

//             striker: {
//               ...emptyBatsman(),
//               ...(currentScore?.striker || {}),
//             },

//             nonStriker: {
//               ...emptyBatsman(),
//               ...(currentScore?.nonStriker || {}),
//             },

//             bowler: {
//               ...emptyBowler(),
//               ...(currentScore?.bowler || {}),
//             },
//           };

//           setScore(normalizedScore);

//           setStrikerName(currentScore?.striker?.name || "");

//           setNonStrikerName(currentScore?.nonStriker?.name || "");

//           setBowlerName(currentScore?.bowler?.name || "");
//         } catch (scoreError) {
//           console.warn("CURRENT SCORE NOT AVAILABLE:", scoreError);
//         }

//         try {
//           const inningsResponse = await inningsAPI.getCurrent(id);

//           const innings = normalizeResponse(inningsResponse);

//           if (innings) {
//             const target =
//               innings?.target ?? innings?.targetRuns ?? innings?.requiredRuns;

//             if (target != null) {
//               setScore((previous) => ({
//                 ...previous,
//                 target: Number(target),
//               }));
//             }
//           }
//         } catch (inningsError) {
//           console.warn("CURRENT INNINGS NOT AVAILABLE:", inningsError);
//         }
//       }
//     } catch (err) {
//       console.error("INITIALIZE MATCH ERROR:", err);

//       setError(
//         err?.response?.data?.message ||
//           err?.message ||
//           "Unable to initialize match.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ==========================================================
//   // MATCH SELECT
//   // ==========================================================

//   const handleMatchSelect = async (event) => {
//     const id = event.target.value;

//     if (!id) {
//       setSelectedMatch(null);
//       setMatchId(null);
//       resetScoreboardUI();
//       return;
//     }

//     const match = matches.find(
//       (item) => String(getMatchId(item)) === String(id),
//     );

//     if (match) {
//       await initializeMatch(match);
//     }
//   };

//   // ==========================================================
//   // START MATCH
//   // ==========================================================

//   const handleStartMatch = async () => {
//     if (!canUpdate) {
//       setError("You do not have permission to manage the score.");
//       return;
//     }

//     if (!matchId) {
//       setError("Please select a match first.");
//       return;
//     }

//     try {
//       setSaving(true);
//       setError("");

//       await matchAPI.start(matchId);

//       try {
//         await inningsAPI.getCurrent(matchId);
//       } catch (err) {
//         console.warn("CURRENT INNINGS:", err);
//       }

//       setMatchCompleted(false);
//       setInningsCompleted(false);

//       setLastAction("Match started successfully.");

//       await loadMatches();

//       const updatedMatch = matches.find(
//         (item) => String(getMatchId(item)) === String(matchId),
//       );

//       if (updatedMatch) {
//         setSelectedMatch({
//           ...updatedMatch,
//           status: "LIVE",
//         });
//       }
//     } catch (err) {
//       console.error("START MATCH ERROR:", err);

//       setError(
//         err?.response?.data?.message ||
//           err?.response?.data?.error ||
//           err?.message ||
//           "Unable to start match.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ==========================================================
//   // ANOTHER MATCH
//   // ==========================================================

//   const handleAnotherMatch = () => {
//     resetScoreboardUI();

//     setSelectedMatch(null);
//     setMatchId(null);

//     setShowCompletedMatchList(true);
//   };

//   // ==========================================================
//   // BALL ENTRY
//   // ==========================================================

//   const createBallEntry = ({
//     label,
//     runs,
//     batsmanRuns,
//     wicket,
//     legalBall,
//     description = "",
//   }) => {
//     return {
//       id: Date.now() + Math.random(),

//       label,

//       runs: Number(runs || 0),

//       batsmanRuns: Number(batsmanRuns || 0),

//       wicket: Boolean(wicket),

//       legalBall: Boolean(legalBall),

//       description,

//       time: new Date().toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//       }),
//     };
//   };

//   // ==========================================================
//   // RECORD DELIVERY
//   // ==========================================================

//   const recordDelivery = async ({
//     runs = 0,
//     batsmanRuns = null,
//     wicket = false,
//     label = "",
//     legalBall = true,
//     description = "",
//   }) => {
//     if (!canUpdate) {
//       setError("You do not have permission to update the score.");
//       return false;
//     }

//     if (!matchId) {
//       setError("Please select a match.");
//       return false;
//     }

//     if (matchCompleted) {
//       setError("This match has already been completed.");
//       return false;
//     }

//     if (inningsCompleted) {
//       setError("This innings has already been completed.");
//       return false;
//     }

//     if (bowlerChangeRequired) {
//       setError(
//         "Please enter the new bowler before recording the next delivery.",
//       );
//       return false;
//     }

//     if (!strikerName.trim()) {
//       setError("Please enter striker name.");
//       return false;
//     }

//     if (!nonStrikerName.trim()) {
//       setError("Please enter non-striker name.");
//       return false;
//     }

//     if (!bowlerName.trim()) {
//       setError("Please enter bowler name.");
//       return false;
//     }

//     const numericRuns = Number(runs || 0);

//     const numericBatsmanRuns =
//       batsmanRuns === null ? numericRuns : Number(batsmanRuns || 0);

//     if (numericRuns < 0) {
//       setError("Runs cannot be negative.");
//       return false;
//     }

//     if (numericBatsmanRuns < 0) {
//       setError("Batsman runs cannot be negative.");
//       return false;
//     }

//     if (numericBatsmanRuns > numericRuns) {
//       setError("Batsman runs cannot be greater than total team runs.");
//       return false;
//     }

//     try {
//       setSaving(true);
//       setError("");

//       await scoreAPI.recordBall({
//         matchId,
//         runs: numericRuns,
//         wicket: Boolean(wicket),
//         ballType: label || String(numericRuns),
//       });

//       const previousScore = score;

//       const previousBalls = Number(previousScore.balls || 0);

//       const newBalls = legalBall ? previousBalls + 1 : previousBalls;

//       const newRuns = Number(previousScore.runs || 0) + numericRuns;

//       const newWickets = Number(previousScore.wickets || 0) + (wicket ? 1 : 0);

//       // ------------------------------------------------------
//       // STRIKER STATS
//       // IMPORTANT:
//       // Only batsmanRuns go to batsman.
//       // Extras do not increase batsman score.
//       // ------------------------------------------------------

//       let newStriker = {
//         ...emptyBatsman(),
//         ...(previousScore.striker || {}),
//         name: strikerName || previousScore.striker?.name || "",
//       };

//       let newNonStriker = {
//         ...emptyBatsman(),
//         ...(previousScore.nonStriker || {}),
//         name: nonStrikerName || previousScore.nonStriker?.name || "",
//       };

//       if (legalBall) {
//         newStriker.balls = Number(newStriker.balls || 0) + 1;
//       }

//       newStriker.runs = Number(newStriker.runs || 0) + numericBatsmanRuns;

//       if (numericBatsmanRuns === 4) {
//         newStriker.fours = Number(newStriker.fours || 0) + 1;
//       }

//       if (numericBatsmanRuns === 6) {
//         newStriker.sixes = Number(newStriker.sixes || 0) + 1;
//       }

//       // ------------------------------------------------------
//       // BOWLER
//       // ------------------------------------------------------

//       const newBowler = {
//         ...emptyBowler(),
//         ...(previousScore.bowler || {}),
//         name: bowlerName || previousScore.bowler?.name || "",
//       };

//       newBowler.runs = Number(newBowler.runs || 0) + numericRuns;

//       if (legalBall) {
//         newBowler.balls = Number(newBowler.balls || 0) + 1;
//       }

//       if (wicket) {
//         newBowler.wickets = Number(newBowler.wickets || 0) + 1;
//       }

//       // ------------------------------------------------------
//       // STRIKE ROTATION
//       //
//       // Extras do NOT rotate strike.
//       // Batsman runs determine odd-run rotation.
//       // ------------------------------------------------------

//       let rotatedStriker = newStriker;
//       let rotatedNonStriker = newNonStriker;

//       if (wicket) {
//         // New batsman will be entered manually.
//         rotatedStriker = {
//           ...newStriker,
//           name: "",
//           runs: 0,
//           balls: 0,
//           fours: 0,
//           sixes: 0,
//         };
//       } else if (legalBall && numericBatsmanRuns % 2 === 1) {
//         rotatedStriker = newNonStriker;
//         rotatedNonStriker = newStriker;
//       }

//       // ------------------------------------------------------
//       // OVER
//       // ------------------------------------------------------

//       const legalBallsInOver = newBalls % 6;

//       const newOvers = Math.floor(newBalls / 6);

//       // ------------------------------------------------------
//       // SCORE STATE
//       // ------------------------------------------------------

//       setScore({
//         ...previousScore,

//         runs: newRuns,

//         wickets: newWickets,

//         balls: newBalls,

//         overs: newOvers,

//         striker: rotatedStriker,

//         nonStriker: rotatedNonStriker,

//         bowler: newBowler,
//       });

//       // ------------------------------------------------------
//       // NAMES
//       // ------------------------------------------------------

//       setStrikerName(rotatedStriker.name || "");

//       setNonStrikerName(rotatedNonStriker.name || "");

//       // ------------------------------------------------------
//       // CURRENT OVER
//       // ------------------------------------------------------

//       const entry = createBallEntry({
//         label,
//         runs: numericRuns,
//         batsmanRuns: numericBatsmanRuns,
//         wicket,
//         legalBall,
//         description,
//       });

//       setCurrentOverBalls((previous) => {
//         const updated = [...previous, entry];

//         if (legalBall && legalBallsInOver === 0) {
//           return [];
//         }

//         return updated;
//       });

//       // ------------------------------------------------------
//       // HISTORY
//       // ------------------------------------------------------

//       setHistory((previous) => [entry, ...previous]);

//       setLastAction(`${label || numericRuns} recorded`);

//       setSelectedRuns(null);

//       // ------------------------------------------------------
//       // WICKET
//       // ------------------------------------------------------

//       if (wicket) {
//         setLastAction(`${label || "WICKET"} — wicket recorded`);
//       }

//       // ------------------------------------------------------
//       // END OF OVER
//       // ------------------------------------------------------

//       if (legalBall && legalBallsInOver === 0) {
//         // Swap strike after over.
//         setScore((previous) => ({
//           ...previous,
//           striker: previous.nonStriker,
//           nonStriker: previous.striker,
//         }));

//         setStrikerName(rotatedNonStriker.name || "");

//         setNonStrikerName(rotatedStriker.name || "");

//         setBowlerChangeRequired(true);

//         setLastAction("Over completed. Please enter the new bowler.");
//       }

//       // ------------------------------------------------------
//       // TARGET
//       // ------------------------------------------------------

//       if (
//         previousScore.target != null &&
//         newRuns >= Number(previousScore.target)
//       ) {
//         setMatchCompleted(true);

//         setLastAction("Target reached. Batting team wins!");
//       }

//       // ------------------------------------------------------
//       // ALL OUT
//       // ------------------------------------------------------

//       if (newWickets >= 10) {
//         setInningsCompleted(true);

//         setLastAction("All out. Innings completed.");
//       }

//       return true;
//     } catch (err) {
//       console.error("RECORD DELIVERY ERROR:", err);

//       setError(
//         err?.response?.data?.message ||
//           err?.response?.data?.error ||
//           err?.message ||
//           "Unable to record delivery.",
//       );

//       return false;
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ==========================================================
//   // NORMAL RUNS
//   // ==========================================================

//   const handleRuns = async (runs) => {
//     setSelectedRuns(runs);

//     await recordDelivery({
//       runs,
//       batsmanRuns: runs,
//       wicket: false,
//       label: String(runs),
//       legalBall: true,
//     });
//   };

//   // ==========================================================
//   // DOT BALL
//   // ==========================================================

//   const handleDotBall = async () => {
//     setSelectedRuns(0);

//     await recordDelivery({
//       runs: 0,
//       batsmanRuns: 0,
//       wicket: false,
//       label: "0",
//       legalBall: true,
//     });
//   };

//   // ==========================================================
//   // WIDE
//   // ==========================================================

//   const handleWide = async () => {
//     await recordDelivery({
//       runs: 1,
//       batsmanRuns: 0,
//       wicket: false,
//       label: "WD",
//       legalBall: false,
//     });
//   };

//   // ==========================================================
//   // NO BALL
//   // ==========================================================

//   const handleNoBall = async () => {
//     await recordDelivery({
//       runs: 1,
//       batsmanRuns: 0,
//       wicket: false,
//       label: "NB",
//       legalBall: false,
//     });
//   };

//   // ==========================================================
//   // WICKET
//   // ==========================================================

//   const handleWicket = async () => {
//     await recordDelivery({
//       runs: 0,
//       batsmanRuns: 0,
//       wicket: true,
//       label: "W",
//       legalBall: true,
//     });
//   };

//   // ==========================================================
//   // MANUAL EXCEPTION
//   // ==========================================================

//   const recordManualException = async () => {
//     if (!canUpdate) {
//       setError("You do not have permission to manage the score.");
//       return;
//     }

//     if (!matchId) {
//       setError("Please select a match.");
//       return;
//     }

//     if (matchCompleted) {
//       setError("Match is already completed.");
//       return;
//     }

//     if (inningsCompleted) {
//       setError("Innings is already completed.");
//       return;
//     }

//     const preview = getExceptionPreview();

//     // --------------------------------------------------------
//     // EXTRA VALIDATION
//     // --------------------------------------------------------

//     if (exceptionType === "NO_BALL" && Number(exceptionRuns || 0) > 6) {
//       setError(
//         "For a no-ball, use 0-6 batsman runs. Use another exception for unusual scoring.",
//       );
//       return;
//     }

//     if (exceptionType === "WIDE" && Number(exceptionRuns || 0) > 5) {
//       setError("Additional wide runs should normally be between 0 and 5.");
//       return;
//     }

//     const success = await recordDelivery({
//       runs: preview.teamRuns,

//       batsmanRuns: preview.batsmanRuns,

//       wicket: exceptionWicket,

//       label:
//         exceptionWicket && exceptionType !== "LEGAL_WICKET"
//           ? `${preview.label} + W`
//           : preview.label,

//       legalBall: preview.legalBall,

//       description: exceptionDescription.trim(),
//     });

//     if (success) {
//       setExceptionRuns(0);
//       setExceptionWicket(false);
//       setExceptionDescription("");
//     }
//   };

//   // ==========================================================
//   // QUICK EXCEPTION BUTTONS
//   // ==========================================================

//   const setQuickException = ({ type, runs, wicket }) => {
//     setExceptionType(type);
//     setExceptionRuns(runs);
//     setExceptionWicket(Boolean(wicket));
//     setShowExceptionPanel(true);
//   };

//   // ==========================================================
//   // CHANGE BOWLER
//   // ==========================================================

//   const changeBowler = () => {
//     if (!nextBowlerName.trim()) {
//       setError("Please enter the new bowler name.");
//       return;
//     }

//     setBowlerName(nextBowlerName.trim());

//     setScore((previous) => ({
//       ...previous,
//       bowler: {
//         ...emptyBowler(),
//         name: nextBowlerName.trim(),
//       },
//     }));

//     setNextBowlerName("");

//     setBowlerChangeRequired(false);

//     setLastAction(`New bowler: ${nextBowlerName.trim()}`);

//     setError("");
//   };

//   // ==========================================================
//   // UNDO
//   // ==========================================================

//   const undoLastBall = () => {
//     setError(
//       "Undo is currently available for the local scoreboard history. For a database-safe undo, add a backend delete-ball endpoint.",
//     );
//   };

//   // ==========================================================
//   // END FIRST INNINGS
//   // ==========================================================

//   const endFirstInnings = async () => {
//     if (!canUpdate) {
//       setError("You do not have permission to end innings.");
//       return;
//     }

//     setInningsCompleted(true);

//     setLastAction("First innings completed.");
//   };

//   // ==========================================================
//   // COMPLETE MATCH
//   // ==========================================================

//   const completeMatch = async () => {
//     if (!canUpdate) {
//       setError("You do not have permission to complete this match.");
//       return;
//     }

//     if (!matchId) {
//       setError("Please select a match.");
//       return;
//     }

//     try {
//       setSaving(true);
//       setError("");

//       const existingMatch = selectedMatch || {};

//       await matchAPI.update(matchId, {
//         ...existingMatch,
//         status: "COMPLETED",
//       });

//       setMatchCompleted(true);

//       setLastAction("Match completed successfully.");

//       await loadMatches();
//     } catch (err) {
//       console.error("COMPLETE MATCH ERROR:", err);

//       setError(
//         err?.response?.data?.message ||
//           err?.response?.data?.error ||
//           err?.message ||
//           "Unable to complete match.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ==========================================================
//   // MATCH STATUS
//   // ==========================================================

//   const currentStatus = selectedMatch ? getMatchStatus(selectedMatch) : "";

//   const isLive = currentStatus === "LIVE" || currentStatus === "IN_PROGRESS";

//   // ==========================================================
//   // RENDER
//   // ==========================================================

//   return (
//     <div className="scoreboard-page">
//       {/* ======================================================
//           HEADER
//       ====================================================== */}

//       <header className="scoreboard-header">
//         <div className="header-left">
//           <button
//             className="back-button"
//             onClick={() => navigate("/dashboard")}
//           >
//             <ArrowLeft size={18} />
//             Dashboard
//           </button>

//           <div className="header-title">
//             <div className="header-icon">
//               <Trophy size={22} />
//             </div>

//             <div>
//               <h1>Live Scoreboard</h1>

//               <p>Cricket Command Center</p>
//             </div>
//           </div>
//         </div>

//         <div className="header-right">
//           <div
//             className={`permission-badge ${
//               canUpdate ? "permission-active" : "permission-readonly"
//             }`}
//           >
//             {canUpdate ? (
//               <>
//                 <Zap size={14} />
//                 Score Management
//               </>
//             ) : (
//               <>
//                 <Lock size={14} />
//                 Read Only
//               </>
//             )}
//           </div>

//           {selectedMatch && (
//             <div className="status-pill">
//               <span className={`status-dot ${isLive ? "status-live" : ""}`} />

//               {currentStatus || "SCHEDULED"}
//             </div>
//           )}
//         </div>
//       </header>

//       {/* ======================================================
//           MAIN
//       ====================================================== */}

//       <main className="scoreboard-container">
//         {/* ERROR */}

//         {error && (
//           <div className="error-banner">
//             <ShieldAlert size={19} />

//             <span>{error}</span>

//             <button onClick={() => setError("")}>
//               <X size={17} />
//             </button>
//           </div>
//         )}

//         {/* ====================================================
//             MATCH SELECTOR
//         ==================================================== */}

//         <section className="match-selector-card">
//           <div className="selector-heading">
//             <div className="selector-icon">
//               <CircleDot size={20} />
//             </div>

//             <div>
//               <h2>Select Match</h2>

//               <p>Choose a scheduled or live match</p>
//             </div>
//           </div>

//           <div className="select-wrapper">
//             <select value={matchId || ""} onChange={handleMatchSelect}>
//               <option value="">Select a match</option>

//               {matches.map((match) => {
//                 const id = getMatchId(match);

//                 return (
//                   <option key={id} value={id}>
//                     {getTeam1Name(match)}
//                     {" vs "}
//                     {getTeam2Name(match)}
//                     {" — "}
//                     {getMatchStatus(match)}
//                   </option>
//                 );
//               })}
//             </select>

//             <ChevronDown size={18} />
//           </div>
//         </section>

//         {/* ====================================================
//             NO MATCH
//         ==================================================== */}

//         {!selectedMatch && (
//           <section className="empty-scoreboard">
//             <div className="empty-icon">
//               <Trophy size={42} />
//             </div>

//             <h2>Select a match to begin</h2>

//             <p>
//               Choose a match from the selector above to open the live scoring
//               console.
//             </p>
//           </section>
//         )}

//         {/* ====================================================
//             SCHEDULED MATCH
//         ==================================================== */}

//         {selectedMatch &&
//           !isLive &&
//           !matchCompleted &&
//           currentStatus !== "COMPLETED" && (
//             <section className="start-match-card">
//               <div className="start-match-content">
//                 <div className="start-match-icon">
//                   <Play size={30} />
//                 </div>

//                 <div>
//                   <span className="eyebrow">MATCH READY</span>

//                   <h2>
//                     {getTeam1Name(selectedMatch)} <span>vs</span>{" "}
//                     {getTeam2Name(selectedMatch)}
//                   </h2>

//                   <p>Start the match to begin recording live deliveries.</p>
//                 </div>
//               </div>

//               {canUpdate && (
//                 <button
//                   className="primary-button start-button"
//                   onClick={handleStartMatch}
//                   disabled={saving}
//                 >
//                   <Play size={17} />
//                   {saving ? "Starting..." : "Start Match"}
//                 </button>
//               )}
//             </section>
//           )}

//         {/* ====================================================
//             COMPLETED MATCH
//         ==================================================== */}

//         {selectedMatch && (matchCompleted || currentStatus === "COMPLETED") && (
//           <section className="completed-card">
//             <div className="completed-icon">
//               <Check size={30} />
//             </div>

//             <div className="completed-content">
//               <span className="eyebrow">MATCH COMPLETED</span>

//               <h2>
//                 {getTeam1Name(selectedMatch)} vs {getTeam2Name(selectedMatch)}
//               </h2>

//               <p>
//                 This match has been completed. No additional deliveries can be
//                 recorded.
//               </p>
//             </div>

//             <button className="secondary-button" onClick={handleAnotherMatch}>
//               <RotateCcw size={17} />
//               Another Match
//             </button>
//           </section>
//         )}

//         {/* ====================================================
//             LIVE SCOREBOARD
//         ==================================================== */}

//         {selectedMatch && isLive && !matchCompleted && (
//           <>
//             {/* SCORE HERO */}

//             <section className="score-hero">
//               <div className="score-hero-top">
//                 <div>
//                   <span className="innings-label">
//                     INNINGS{" "}
//                     {getCurrentInningsNumber(selectedMatch?.currentInnings)}
//                   </span>

//                   <h2>{getTeam1Name(selectedMatch)}</h2>
//                 </div>

//                 <div className="live-indicator">
//                   <span />
//                   LIVE
//                 </div>
//               </div>

//               <div className="score-main">
//                 <div className="big-score">
//                   {score.runs}
//                   <span>/{score.wickets}</span>
//                 </div>

//                 <div className="score-meta">
//                   <span>{formatOvers(score.balls)} overs</span>

//                   {score.target != null && <span>Target {score.target}</span>}
//                 </div>
//               </div>

//               <div className="score-teams">
//                 <div>
//                   <span>Batting</span>

//                   <strong>{getTeam1Name(selectedMatch)}</strong>
//                 </div>

//                 <div className="vs-circle">VS</div>

//                 <div className="team-right">
//                   <span>Opposition</span>

//                   <strong>{getTeam2Name(selectedMatch)}</strong>
//                 </div>
//               </div>
//             </section>

//             {/* ==================================================
//                   LAST ACTION
//               ================================================== */}

//             {lastAction && (
//               <div className="last-action">
//                 <Check size={16} />

//                 <span>{lastAction}</span>
//               </div>
//             )}

//             {/* ==================================================
//                   NEW BOWLER
//               ================================================== */}

//             {bowlerChangeRequired && (
//               <section className="new-bowler-card">
//                 <div className="new-bowler-icon">
//                   <User size={22} />
//                 </div>

//                 <div className="new-bowler-content">
//                   <span className="eyebrow">OVER COMPLETED</span>

//                   <h3>New bowler required</h3>

//                   <p>Enter the bowler for the next over.</p>
//                 </div>

//                 <div className="new-bowler-form">
//                   <input
//                     value={nextBowlerName}
//                     onChange={(e) => setNextBowlerName(e.target.value)}
//                     placeholder="New bowler name"
//                   />

//                   <button className="primary-button" onClick={changeBowler}>
//                     <Check size={16} />
//                     Confirm Bowler
//                   </button>
//                 </div>
//               </section>
//             )}

//             {/* ==================================================
//                   PLAYERS
//               ================================================== */}

//             <section className="players-grid">
//               {/* STRIKER */}

//               <div className="player-card striker-card">
//                 <div className="player-card-top">
//                   <div className="player-avatar">
//                     <User size={20} />
//                   </div>

//                   <span className="player-role">STRIKER</span>
//                 </div>

//                 <input
//                   className="player-name-input"
//                   value={strikerName}
//                   onChange={(e) => setStrikerName(e.target.value)}
//                   placeholder="Striker name"
//                 />

//                 <div className="player-stat-row">
//                   <div>
//                     <strong>{score.striker?.runs || 0}</strong>

//                     <span>Runs</span>
//                   </div>

//                   <div>
//                     <strong>{score.striker?.balls || 0}</strong>

//                     <span>Balls</span>
//                   </div>

//                   <div>
//                     <strong>{score.striker?.fours || 0}</strong>

//                     <span>4s</span>
//                   </div>

//                   <div>
//                     <strong>{score.striker?.sixes || 0}</strong>

//                     <span>6s</span>
//                   </div>
//                 </div>
//               </div>

//               {/* NON STRIKER */}

//               <div className="player-card">
//                 <div className="player-card-top">
//                   <div className="player-avatar muted">
//                     <User size={20} />
//                   </div>

//                   <span className="player-role">NON-STRIKER</span>
//                 </div>

//                 <input
//                   className="player-name-input"
//                   value={nonStrikerName}
//                   onChange={(e) => setNonStrikerName(e.target.value)}
//                   placeholder="Non-striker name"
//                 />

//                 <div className="player-stat-row">
//                   <div>
//                     <strong>{score.nonStriker?.runs || 0}</strong>

//                     <span>Runs</span>
//                   </div>

//                   <div>
//                     <strong>{score.nonStriker?.balls || 0}</strong>

//                     <span>Balls</span>
//                   </div>

//                   <div>
//                     <strong>{score.nonStriker?.fours || 0}</strong>

//                     <span>4s</span>
//                   </div>

//                   <div>
//                     <strong>{score.nonStriker?.sixes || 0}</strong>

//                     <span>6s</span>
//                   </div>
//                 </div>
//               </div>

//               {/* BOWLER */}

//               <div className="player-card bowler-card">
//                 <div className="player-card-top">
//                   <div className="player-avatar bowler">
//                     <Zap size={20} />
//                   </div>

//                   <span className="player-role">BOWLER</span>
//                 </div>

//                 <input
//                   className="player-name-input"
//                   value={bowlerName}
//                   onChange={(e) => setBowlerName(e.target.value)}
//                   placeholder="Bowler name"
//                 />

//                 <div className="player-stat-row">
//                   <div>
//                     <strong>{score.bowler?.runs || 0}</strong>

//                     <span>Runs</span>
//                   </div>

//                   <div>
//                     <strong>{formatOvers(score.bowler?.balls || 0)}</strong>

//                     <span>Overs</span>
//                   </div>

//                   <div>
//                     <strong>{score.bowler?.wickets || 0}</strong>

//                     <span>Wkts</span>
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* ==================================================
//                   CURRENT OVER
//               ================================================== */}

//             <section className="current-over-card">
//               <div className="section-heading">
//                 <div>
//                   <span className="eyebrow">BALL BY BALL</span>

//                   <h3>Current Over</h3>
//                 </div>

//                 <div className="over-number">
//                   Over {Math.floor(Number(score.balls || 0) / 6) + 1}
//                 </div>
//               </div>

//               <div className="over-balls">
//                 {currentOverBalls.length === 0 && (
//                   <div className="empty-over">No deliveries yet</div>
//                 )}

//                 {currentOverBalls.map((ball) => (
//                   <div
//                     key={ball.id}
//                     className={`over-ball ${
//                       ball.wicket
//                         ? "ball-wicket"
//                         : ball.label?.startsWith("NB")
//                           ? "ball-noball"
//                           : ball.label?.startsWith("WD")
//                             ? "ball-wide"
//                             : ball.runs === 4
//                               ? "ball-four"
//                               : ball.runs === 6
//                                 ? "ball-six"
//                                 : ""
//                     }`}
//                   >
//                     {ball.wicket ? "W" : ball.label}
//                   </div>
//                 ))}
//               </div>
//             </section>

//             {/* ==================================================
//                   SCORING CONSOLE
//               ================================================== */}

//             <section className="scoring-console">
//               <div className="section-heading">
//                 <div>
//                   <span className="eyebrow">SCORING CONSOLE</span>

//                   <h3>Record Delivery</h3>
//                 </div>

//                 <div className="manual-label">
//                   <Edit3 size={14} />
//                   Manual scoring
//                 </div>
//               </div>

//               {/* NORMAL RUNS */}

//               <div className="run-buttons">
//                 {[0, 1, 2, 3, 4, 6].map((runs) => (
//                   <button
//                     key={runs}
//                     className={`run-button run-${runs}`}
//                     onClick={() =>
//                       runs === 0 ? handleDotBall() : handleRuns(runs)
//                     }
//                     disabled={saving || bowlerChangeRequired || !canUpdate}
//                   >
//                     {runs}
//                   </button>
//                 ))}
//               </div>

//               {/* BASIC EXTRAS */}

//               <div className="special-buttons">
//                 <button
//                   className="special-button wide"
//                   onClick={handleWide}
//                   disabled={saving || bowlerChangeRequired || !canUpdate}
//                 >
//                   WD
//                   <span>Wide</span>
//                 </button>

//                 <button
//                   className="special-button noball"
//                   onClick={handleNoBall}
//                   disabled={saving || bowlerChangeRequired || !canUpdate}
//                 >
//                   NB
//                   <span>No Ball</span>
//                 </button>

//                 <button
//                   className="special-button wicket"
//                   onClick={handleWicket}
//                   disabled={saving || bowlerChangeRequired || !canUpdate}
//                 >
//                   W<span>Wicket</span>
//                 </button>
//               </div>

//               {/* ==================================================
//                     MANUAL EXCEPTION TOGGLE
//                 ================================================== */}

//               <div className="manual-exception-wrapper">
//                 <button
//                   className={`manual-exception-toggle ${
//                     showExceptionPanel ? "active" : ""
//                   }`}
//                   onClick={() => setShowExceptionPanel((previous) => !previous)}
//                 >
//                   <div className="manual-toggle-left">
//                     <div className="manual-toggle-icon">
//                       <Edit3 size={17} />
//                     </div>

//                     <div>
//                       <strong>Manual Exceptions</strong>

//                       <span>
//                         No-ball + wicket, wide + four, custom extras and more
//                       </span>
//                     </div>
//                   </div>

//                   <ChevronDown
//                     className={showExceptionPanel ? "rotate" : ""}
//                     size={19}
//                   />
//                 </button>

//                 {showExceptionPanel && (
//                   <div className="manual-exception-panel">
//                     {/* HEADER */}

//                     <div className="exception-header">
//                       <div>
//                         <span className="eyebrow">ADVANCED SCORING</span>

//                         <h4>Add unusual delivery</h4>

//                         <p>
//                           Manually enter combinations that are not covered by
//                           the standard buttons.
//                         </p>
//                       </div>

//                       <div className="exception-warning">
//                         <ShieldAlert size={18} />
//                         Verify the event before saving.
//                       </div>
//                     </div>

//                     {/* QUICK COMBINATIONS */}

//                     <div className="exception-section">
//                       <div className="exception-section-title">
//                         Quick combinations
//                       </div>

//                       <div className="exception-quick-grid">
//                         <button
//                           type="button"
//                           onClick={() =>
//                             setQuickException({
//                               type: "NO_BALL",
//                               runs: 0,
//                               wicket: true,
//                             })
//                           }
//                         >
//                           <strong>NB + W</strong>

//                           <span>1 team run + wicket</span>
//                         </button>

//                         <button
//                           type="button"
//                           onClick={() =>
//                             setQuickException({
//                               type: "NO_BALL",
//                               runs: 4,
//                               wicket: false,
//                             })
//                           }
//                         >
//                           <strong>NB + 4</strong>

//                           <span>5 team runs</span>
//                         </button>

//                         <button
//                           type="button"
//                           onClick={() =>
//                             setQuickException({
//                               type: "NO_BALL",
//                               runs: 6,
//                               wicket: false,
//                             })
//                           }
//                         >
//                           <strong>NB + 6</strong>

//                           <span>7 team runs</span>
//                         </button>

//                         <button
//                           type="button"
//                           onClick={() =>
//                             setQuickException({
//                               type: "WIDE",
//                               runs: 0,
//                               wicket: true,
//                             })
//                           }
//                         >
//                           <strong>WD + W</strong>

//                           <span>1 team run + wicket</span>
//                         </button>

//                         <button
//                           type="button"
//                           onClick={() =>
//                             setQuickException({
//                               type: "WIDE",
//                               runs: 3,
//                               wicket: false,
//                             })
//                           }
//                         >
//                           <strong>WD + 4</strong>

//                           <span>4 total wide runs</span>
//                         </button>

//                         <button
//                           type="button"
//                           onClick={() =>
//                             setQuickException({
//                               type: "WIDE",
//                               runs: 5,
//                               wicket: false,
//                             })
//                           }
//                         >
//                           <strong>WD + 6</strong>

//                           <span>6 total wide runs</span>
//                         </button>
//                       </div>
//                     </div>

//                     {/* FORM */}

//                     <div className="exception-form-grid">
//                       {/* TYPE */}

//                       <div className="exception-field">
//                         <label>Exception Type</label>

//                         <select
//                           value={exceptionType}
//                           onChange={(e) => {
//                             setExceptionType(e.target.value);

//                             setExceptionRuns(0);

//                             setExceptionWicket(false);
//                           }}
//                         >
//                           <option value="NO_BALL">No Ball</option>

//                           <option value="WIDE">Wide</option>

//                           <option value="LEGAL_WICKET">Legal Ball</option>
//                         </select>
//                       </div>

//                       {/* RUNS */}

//                       <div className="exception-field">
//                         <label>
//                           {exceptionType === "NO_BALL"
//                             ? "Batsman Runs"
//                             : exceptionType === "WIDE"
//                               ? "Additional Wide Runs"
//                               : "Batsman Runs"}
//                         </label>

//                         <input
//                           type="number"
//                           min="0"
//                           max={exceptionType === "NO_BALL" ? 6 : 10}
//                           value={exceptionRuns}
//                           onChange={(e) =>
//                             setExceptionRuns(
//                               Math.max(0, Number(e.target.value)),
//                             )
//                           }
//                         />
//                       </div>

//                       {/* WICKET */}

//                       <div className="exception-field checkbox-field">
//                         <label>Wicket?</label>

//                         <label className="exception-checkbox">
//                           <input
//                             type="checkbox"
//                             checked={exceptionWicket}
//                             onChange={(e) =>
//                               setExceptionWicket(e.target.checked)
//                             }
//                           />

//                           <span className="custom-checkbox">
//                             <Check size={13} />
//                           </span>

//                           <span>Record wicket</span>
//                         </label>
//                       </div>
//                     </div>

//                     {/* DESCRIPTION */}

//                     <div className="exception-field">
//                       <label>
//                         Description <span>Optional</span>
//                       </label>

//                       <input
//                         type="text"
//                         value={exceptionDescription}
//                         onChange={(e) =>
//                           setExceptionDescription(e.target.value)
//                         }
//                         placeholder="Example: No-ball + run out"
//                       />
//                     </div>

//                     {/* PREVIEW */}

//                     <div className="exception-preview">
//                       <div className="preview-left">
//                         <span>DELIVERY</span>

//                         <strong>
//                           {exceptionPreview.label}

//                           {exceptionWicket &&
//                             exceptionType !== "LEGAL_WICKET" &&
//                             " + W"}
//                         </strong>
//                       </div>

//                       <div className="preview-stat">
//                         <span>TEAM RUNS</span>

//                         <strong>{exceptionPreview.teamRuns}</strong>
//                       </div>

//                       <div className="preview-stat">
//                         <span>BATSMAN</span>

//                         <strong>{exceptionPreview.batsmanRuns}</strong>
//                       </div>

//                       <div className="preview-stat">
//                         <span>BALL</span>

//                         <strong
//                           className={
//                             exceptionPreview.legalBall ? "legal" : "illegal"
//                           }
//                         >
//                           {exceptionPreview.legalBall ? "LEGAL" : "NOT LEGAL"}
//                         </strong>
//                       </div>
//                     </div>

//                     {/* ACTION */}

//                     <div className="exception-actions">
//                       <button
//                         type="button"
//                         className="exception-cancel-button"
//                         onClick={() => setShowExceptionPanel(false)}
//                       >
//                         Cancel
//                       </button>

//                       <button
//                         type="button"
//                         className="record-exception-button"
//                         onClick={recordManualException}
//                         disabled={saving || bowlerChangeRequired || !canUpdate}
//                       >
//                         <Check size={17} />

//                         {saving ? "Recording..." : "Record Exception"}
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </section>

//             {/* ==================================================
//                   RECENT DELIVERIES
//               ================================================== */}

//             <section className="recent-card">
//               <div className="section-heading">
//                 <div>
//                   <span className="eyebrow">MATCH HISTORY</span>

//                   <h3>Recent Deliveries</h3>
//                 </div>

//                 <History size={20} />
//               </div>

//               {history.length === 0 ? (
//                 <div className="empty-history">No deliveries recorded yet.</div>
//               ) : (
//                 <div className="history-list">
//                   {history.slice(0, 10).map((ball) => (
//                     <div className="history-item" key={ball.id}>
//                       <div className="history-ball">
//                         {ball.wicket ? (
//                           <span className="history-wicket">W</span>
//                         ) : (
//                           ball.label
//                         )}
//                       </div>

//                       <div className="history-details">
//                         <strong>{ball.label}</strong>

//                         {ball.description && <span>{ball.description}</span>}
//                       </div>

//                       <div className="history-runs">
//                         <span>Team</span>

//                         <strong>{ball.runs}</strong>
//                       </div>

//                       <div className="history-runs">
//                         <span>Bat</span>

//                         <strong>{ball.batsmanRuns}</strong>
//                       </div>

//                       <div
//                         className={`legal-badge ${
//                           ball.legalBall ? "legal" : "illegal"
//                         }`}
//                       >
//                         {ball.legalBall ? "Legal" : "Extra"}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {history.length > 0 && (
//                 <button className="undo-button" onClick={undoLastBall}>
//                   <RotateCcw size={15} />
//                   Undo last ball
//                 </button>
//               )}
//             </section>

//             {/* ==================================================
//                   INNINGS CONTROLS
//               ================================================== */}

//             <section className="control-card">
//               <div className="control-card-info">
//                 <div className="control-icon">
//                   <Clock size={20} />
//                 </div>

//                 <div>
//                   <h3>Innings Controls</h3>

//                   <p>
//                     End the current innings when the batting side is finished.
//                   </p>
//                 </div>
//               </div>

//               <button
//                 className="secondary-button"
//                 onClick={endFirstInnings}
//                 disabled={inningsCompleted || saving || !canUpdate}
//               >
//                 {inningsCompleted ? "Innings Completed" : "End Innings"}
//               </button>
//             </section>

//             {/* ==================================================
//                   COMPLETE MATCH
//               ================================================== */}

//             <section className="complete-match-card">
//               <div>
//                 <span className="eyebrow">FINAL ACTION</span>

//                 <h3>Complete Match</h3>

//                 <p>
//                   Use this after the result is confirmed and no more scoring is
//                   required.
//                 </p>
//               </div>

//               <button
//                 className="complete-button"
//                 onClick={completeMatch}
//                 disabled={saving || matchCompleted || !canUpdate}
//               >
//                 <Trophy size={17} />

//                 {saving ? "Completing..." : "Complete Match"}
//               </button>
//             </section>
//           </>
//         )}
//       </main>

//       {/* ========================================================
//           LOADING
//       ======================================================== */}

//       {loading && (
//         <div className="loading-overlay">
//           <div className="loading-card">
//             <div className="loading-spinner" />

//             <strong>Loading scoreboard...</strong>

//             <span>Please wait</span>
//           </div>
//         </div>
//       )}
//       <style>{`/* ============================================================
//    SCOREBOARD PAGE
// ============================================================ */

// .scoreboard-page {
//   min-height: 100vh;
//   background:
//     radial-gradient(
//       circle at 15% 10%,
//       rgba(80, 90, 255, 0.12),
//       transparent 30%
//     ),
//     radial-gradient(
//       circle at 85% 20%,
//       rgba(0, 210, 180, 0.08),
//       transparent 28%
//     ),
//     #080b12;
//   color: #f7f8fb;
// }

// /* ============================================================
//    HEADER
// ============================================================ */

// .scoreboard-header {
//   min-height: 78px;
//   padding: 16px 32px;

//   display: flex;
//   align-items: center;
//   justify-content: space-between;

//   border-bottom: 1px solid rgba(255,255,255,0.07);

//   background: rgba(9,12,19,0.88);

//   backdrop-filter: blur(20px);

//   position: sticky;
//   top: 0;

//   z-index: 100;
// }

// .header-left,
// .header-right {
//   display: flex;
//   align-items: center;
//   gap: 18px;
// }

// .back-button {
//   display: flex;
//   align-items: center;
//   gap: 8px;

//   border: 0;
//   background: transparent;

//   color: #8d96a8;

//   cursor: pointer;

//   font-size: 14px;

//   transition: 0.2s ease;
// }

// .back-button:hover {
//   color: #ffffff;
// }

// .header-title {
//   display: flex;
//   align-items: center;
//   gap: 13px;
// }

// .header-icon {
//   width: 42px;
//   height: 42px;

//   border-radius: 13px;

//   display: grid;
//   place-items: center;

//   background:
//     linear-gradient(
//       135deg,
//       #6c63ff,
//       #8b5cf6
//     );

//   box-shadow:
//     0 10px 35px
//     rgba(108,99,255,0.3);
// }

// .header-title h1 {
//   margin: 0;

//   font-size: 20px;

//   font-weight: 800;

//   letter-spacing: -0.5px;
// }

// .header-title p {
//   margin: 3px 0 0;

//   font-size: 12px;

//   color: #747e91;
// }

// .permission-badge,
// .status-pill {
//   display: flex;
//   align-items: center;
//   gap: 7px;

//   padding: 9px 13px;

//   border-radius: 999px;

//   font-size: 12px;
//   font-weight: 700;
// }

// .permission-active {
//   color: #75f0cf;

//   background: rgba(30,210,170,0.09);

//   border: 1px solid
//     rgba(30,210,170,0.18);
// }

// .permission-readonly {
//   color: #a8b0c0;

//   background: rgba(255,255,255,0.05);

//   border: 1px solid
//     rgba(255,255,255,0.08);
// }

// .status-pill {
//   color: #d8deea;

//   background: rgba(255,255,255,0.05);

//   border: 1px solid
//     rgba(255,255,255,0.08);
// }

// .status-dot {
//   width: 7px;
//   height: 7px;

//   border-radius: 50%;

//   background: #737b8c;
// }

// .status-live {
//   background: #35e4a5;

//   box-shadow:
//     0 0 0 4px
//     rgba(53,228,165,0.1);
// }

// /* ============================================================
//    CONTAINER
// ============================================================ */

// .scoreboard-container {
//   width: min(1280px, calc(100% - 40px));

//   margin: 0 auto;

//   padding: 32px 0 70px;
// }

// /* ============================================================
//    ERROR
// ============================================================ */

// .error-banner {
//   display: flex;
//   align-items: center;
//   gap: 11px;

//   padding: 13px 15px;

//   margin-bottom: 20px;

//   border-radius: 14px;

//   color: #ffb7bf;

//   background:
//     rgba(255,75,95,0.08);

//   border:
//     1px solid rgba(255,75,95,0.2);
// }

// .error-banner span {
//   flex: 1;

//   font-size: 13px;
// }

// .error-banner button {
//   border: 0;

//   background: transparent;

//   color: inherit;

//   cursor: pointer;
// }

// /* ============================================================
//    MATCH SELECTOR
// ============================================================ */

// .match-selector-card {
//   padding: 20px;

//   margin-bottom: 20px;

//   display: flex;
//   align-items: center;
//   justify-content: space-between;

//   gap: 25px;

//   border:
//     1px solid rgba(255,255,255,0.08);

//   border-radius: 18px;

//   background:
//     rgba(17,21,31,0.82);

//   box-shadow:
//     0 20px 60px
//     rgba(0,0,0,0.18);
// }

// .selector-heading {
//   display: flex;
//   align-items: center;
//   gap: 13px;
// }

// .selector-icon {
//   width: 42px;
//   height: 42px;

//   display: grid;
//   place-items: center;

//   border-radius: 12px;

//   background:
//     rgba(108,99,255,0.12);

//   color: #938cff;
// }

// .selector-heading h2 {
//   margin: 0;

//   font-size: 15px;
// }

// .selector-heading p {
//   margin: 4px 0 0;

//   font-size: 12px;

//   color: #727c90;
// }

// .select-wrapper {
//   width: min(470px, 100%);

//   position: relative;
// }

// .select-wrapper select {
//   width: 100%;

//   appearance: none;

//   padding: 13px 42px 13px 15px;

//   border-radius: 12px;

//   border:
//     1px solid rgba(255,255,255,0.1);

//   background:
//     #10151f;

//   color: #ffffff;

//   outline: none;

//   cursor: pointer;
// }

// .select-wrapper svg {
//   position: absolute;

//   right: 14px;
//   top: 50%;

//   transform: translateY(-50%);

//   color: #7c8598;

//   pointer-events: none;
// }

// /* ============================================================
//    EMPTY
// ============================================================ */

// .empty-scoreboard {
//   padding: 90px 25px;

//   text-align: center;

//   border-radius: 22px;

//   border:
//     1px dashed rgba(255,255,255,0.1);

//   background:
//     rgba(15,19,28,0.55);
// }

// .empty-icon {
//   width: 80px;
//   height: 80px;

//   margin: 0 auto 20px;

//   display: grid;
//   place-items: center;

//   border-radius: 24px;

//   color: #8d86ff;

//   background:
//     rgba(108,99,255,0.1);
// }

// .empty-scoreboard h2 {
//   margin: 0 0 8px;

//   font-size: 22px;
// }

// .empty-scoreboard p {
//   margin: 0;

//   color: #737d90;

//   font-size: 14px;
// }

// /* ============================================================
//    START MATCH
// ============================================================ */

// .start-match-card,
// .completed-card {
//   padding: 25px;

//   display: flex;
//   align-items: center;
//   justify-content: space-between;

//   gap: 25px;

//   border-radius: 20px;

//   border:
//     1px solid rgba(255,255,255,0.08);

//   background:
//     linear-gradient(
//       135deg,
//       rgba(19,24,35,0.95),
//       rgba(13,17,26,0.95)
//     );

//   margin-bottom: 20px;
// }

// .start-match-content,
// .completed-card {
//   display: flex;
//   align-items: center;
//   gap: 18px;
// }

// .start-match-icon,
// .completed-icon {
//   width: 58px;
//   height: 58px;

//   flex-shrink: 0;

//   display: grid;
//   place-items: center;

//   border-radius: 17px;

//   background:
//     linear-gradient(
//       135deg,
//       #6c63ff,
//       #8b5cf6
//     );

//   box-shadow:
//     0 15px 35px
//     rgba(108,99,255,0.2);
// }

// .completed-icon {
//   background:
//     linear-gradient(
//       135deg,
//       #15c99a,
//       #36e0ac
//     );

//   color: #03120d;
// }

// .eyebrow {
//   display: block;

//   margin-bottom: 6px;

//   color: #737e92;

//   font-size: 10px;

//   font-weight: 800;

//   letter-spacing: 1.4px;
// }

// .start-match-card h2,
// .completed-card h2 {
//   margin: 0;

//   font-size: 21px;
// }

// .start-match-card h2 span {
//   color: #656e80;

//   font-size: 13px;
// }

// .start-match-card p,
// .completed-card p {
//   margin: 7px 0 0;

//   color: #747e91;

//   font-size: 13px;
// }

// /* ============================================================
//    BUTTONS
// ============================================================ */

// .primary-button,
// .secondary-button,
// .complete-button {
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;

//   gap: 8px;

//   border: 0;

//   border-radius: 11px;

//   padding: 12px 17px;

//   font-weight: 700;

//   font-size: 13px;

//   cursor: pointer;

//   transition:
//     transform 0.2s ease,
//     box-shadow 0.2s ease,
//     opacity 0.2s ease;
// }

// .primary-button {
//   color: white;

//   background:
//     linear-gradient(
//       135deg,
//       #6c63ff,
//       #8b5cf6
//     );

//   box-shadow:
//     0 10px 30px
//     rgba(108,99,255,0.22);
// }

// .primary-button:hover,
// .complete-button:hover {
//   transform: translateY(-1px);
// }

// .secondary-button {
//   color: #dce2ed;

//   background:
//     rgba(255,255,255,0.06);

//   border:
//     1px solid rgba(255,255,255,0.1);
// }

// .primary-button:disabled,
// .secondary-button:disabled,
// .complete-button:disabled {
//   opacity: 0.45;

//   cursor: not-allowed;

//   transform: none;
// }

// /* ============================================================
//    SCORE HERO
// ============================================================ */

// .score-hero {
//   padding: 28px;

//   margin-bottom: 20px;

//   overflow: hidden;

//   border-radius: 24px;

//   background:
//     radial-gradient(
//       circle at 80% 0%,
//       rgba(108,99,255,0.22),
//       transparent 35%
//     ),
//     linear-gradient(
//       135deg,
//       #151b2a,
//       #0e131d
//     );

//   border:
//     1px solid rgba(255,255,255,0.08);

//   box-shadow:
//     0 30px 80px
//     rgba(0,0,0,0.24);
// }

// .score-hero-top {
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-start;
// }

// .innings-label {
//   color: #737e92;

//   font-size: 10px;

//   font-weight: 800;

//   letter-spacing: 1.5px;
// }

// .score-hero h2 {
//   margin: 7px 0 0;

//   font-size: 22px;
// }

// .live-indicator {
//   display: flex;
//   align-items: center;
//   gap: 7px;

//   padding: 7px 10px;

//   color: #5ceab5;

//   border-radius: 999px;

//   background:
//     rgba(48,226,164,0.08);

//   font-size: 11px;

//   font-weight: 800;
// }

// .live-indicator span {
//   width: 6px;
//   height: 6px;

//   border-radius: 50%;

//   background: #45e8ad;
// }

// .score-main {
//   display: flex;
//   align-items: baseline;
//   gap: 20px;

//   margin-top: 20px;
// }

// .big-score {
//   font-size: clamp(55px, 9vw, 92px);

//   line-height: 0.9;

//   font-weight: 900;

//   letter-spacing: -5px;
// }

// .big-score span {
//   color: #697387;

//   font-size: 0.52em;

//   letter-spacing: -2px;
// }

// .score-meta {
//   display: flex;
//   flex-direction: column;

//   gap: 5px;

//   color: #8d97aa;

//   font-size: 13px;
// }

// .score-teams {
//   display: grid;

//   grid-template-columns: 1fr auto 1fr;

//   align-items: center;

//   gap: 20px;

//   margin-top: 30px;

//   padding-top: 20px;

//   border-top:
//     1px solid rgba(255,255,255,0.07);
// }

// .score-teams > div:not(.vs-circle) {
//   display: flex;
//   flex-direction: column;

//   gap: 5px;
// }

// .score-teams span {
//   color: #697387;

//   font-size: 10px;

//   text-transform: uppercase;

//   letter-spacing: 1px;
// }

// .score-teams strong {
//   font-size: 14px;
// }

// .team-right {
//   text-align: right;
// }

// .vs-circle {
//   width: 38px;
//   height: 38px;

//   display: grid;
//   place-items: center;

//   border-radius: 50%;

//   color: #8f98aa;

//   background:
//     rgba(255,255,255,0.05);

//   font-size: 10px;

//   font-weight: 800;
// }

// /* ============================================================
//    LAST ACTION
// ============================================================ */

// .last-action {
//   display: flex;
//   align-items: center;
//   gap: 9px;

//   padding: 11px 14px;

//   margin-bottom: 20px;

//   border-radius: 12px;

//   color: #72eabd;

//   background:
//     rgba(30,210,170,0.07);

//   border:
//     1px solid rgba(30,210,170,0.13);

//   font-size: 12px;
// }

// /* ============================================================
//    NEW BOWLER
// ============================================================ */

// .new-bowler-card {
//   display: grid;

//   grid-template-columns: auto 1fr auto;

//   align-items: center;

//   gap: 15px;

//   padding: 19px;

//   margin-bottom: 20px;

//   border-radius: 17px;

//   background:
//     rgba(108,99,255,0.07);

//   border:
//     1px solid rgba(108,99,255,0.15);
// }

// .new-bowler-icon {
//   width: 43px;
//   height: 43px;

//   display: grid;
//   place-items: center;

//   border-radius: 13px;

//   color: #9a93ff;

//   background:
//     rgba(108,99,255,0.13);
// }

// .new-bowler-content h3 {
//   margin: 0;

//   font-size: 15px;
// }

// .new-bowler-content p {
//   margin: 4px 0 0;

//   color: #727d91;

//   font-size: 12px;
// }

// .new-bowler-form {
//   display: flex;
//   gap: 8px;
// }

// .new-bowler-form input {
//   width: 190px;
// }

// /* ============================================================
//    INPUTS
// ============================================================ */

// input,
// select {
//   outline: none;

//   font-family: inherit;
// }

// .player-name-input,
// .new-bowler-form input {
//   width: 100%;

//   padding: 11px 12px;

//   border-radius: 10px;

//   border:
//     1px solid rgba(255,255,255,0.08);

//   background:
//     rgba(5,8,14,0.55);

//   color: white;

//   font-size: 13px;

//   transition: 0.2s ease;
// }

// .player-name-input:focus,
// .new-bowler-form input:focus,
// .exception-field input:focus,
// .exception-field select:focus {
//   border-color:
//     rgba(108,99,255,0.65);

//   box-shadow:
//     0 0 0 3px
//     rgba(108,99,255,0.08);
// }

// .player-name-input::placeholder,
// .new-bowler-form input::placeholder,
// .exception-field input::placeholder {
//   color: #596375;
// }

// /* ============================================================
//    PLAYERS
// ============================================================ */

// .players-grid {
//   display: grid;

//   grid-template-columns:
//     repeat(3, 1fr);

//   gap: 15px;

//   margin-bottom: 20px;
// }

// .player-card {
//   padding: 18px;

//   border-radius: 17px;

//   border:
//     1px solid rgba(255,255,255,0.07);

//   background:
//     rgba(15,19,28,0.82);
// }

// .striker-card {
//   border-color:
//     rgba(108,99,255,0.22);
// }

// .bowler-card {
//   border-color:
//     rgba(53,228,165,0.14);
// }

// .player-card-top {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;

//   margin-bottom: 14px;
// }

// .player-avatar {
//   width: 39px;
//   height: 39px;

//   display: grid;
//   place-items: center;

//   border-radius: 11px;

//   color: #9b94ff;

//   background:
//     rgba(108,99,255,0.11);
// }

// .player-avatar.muted {
//   color: #8e98aa;

//   background:
//     rgba(255,255,255,0.05);
// }

// .player-avatar.bowler {
//   color: #55e6b0;

//   background:
//     rgba(53,228,165,0.09);
// }

// .player-role {
//   color: #687286;

//   font-size: 9px;

//   font-weight: 800;

//   letter-spacing: 1.2px;
// }

// .player-stat-row {
//   display: grid;

//   grid-template-columns:
//     repeat(4, 1fr);

//   margin-top: 15px;

//   gap: 5px;
// }

// .player-stat-row > div {
//   text-align: center;
// }

// .player-stat-row strong {
//   display: block;

//   font-size: 16px;
// }

// .player-stat-row span {
//   display: block;

//   margin-top: 3px;

//   color: #697387;

//   font-size: 9px;
// }

// /* ============================================================
//    CURRENT OVER
// ============================================================ */

// .current-over-card,
// .scoring-console,
// .recent-card,
// .control-card {
//   padding: 21px;

//   margin-bottom: 20px;

//   border-radius: 18px;

//   border:
//     1px solid rgba(255,255,255,0.07);

//   background:
//     rgba(15,19,28,0.8);
// }

// .section-heading {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;

//   margin-bottom: 18px;

//   color: #7d879a;
// }

// .section-heading h3 {
//   margin: 0;

//   color: #f4f6fa;

//   font-size: 16px;
// }

// .over-number,
// .manual-label {
//   padding: 7px 10px;

//   border-radius: 9px;

//   color: #8993a7;

//   background:
//     rgba(255,255,255,0.05);

//   font-size: 11px;
// }

// .manual-label {
//   display: flex;
//   align-items: center;
//   gap: 6px;
// }

// .over-balls {
//   min-height: 58px;

//   display: flex;
//   align-items: center;

//   gap: 9px;

//   overflow-x: auto;
// }

// .empty-over {
//   color: #606a7d;

//   font-size: 12px;
// }

// .over-ball {
//   width: 42px;
//   height: 42px;

//   flex-shrink: 0;

//   display: grid;
//   place-items: center;

//   border-radius: 50%;

//   color: #cbd2df;

//   background:
//     rgba(255,255,255,0.06);

//   border:
//     1px solid rgba(255,255,255,0.07);

//   font-size: 12px;

//   font-weight: 800;
// }

// .ball-four {
//   color: #9e98ff;

//   background:
//     rgba(108,99,255,0.12);

//   border-color:
//     rgba(108,99,255,0.22);
// }

// .ball-six {
//   color: #5ee8b5;

//   background:
//     rgba(53,228,165,0.1);

//   border-color:
//     rgba(53,228,165,0.2);
// }

// .ball-wicket {
//   color: #ff8794;

//   background:
//     rgba(255,70,90,0.1);

//   border-color:
//     rgba(255,70,90,0.2);
// }

// .ball-wide,
// .ball-noball {
//   color: #ffc875;

//   background:
//     rgba(255,180,70,0.09);

//   border-color:
//     rgba(255,180,70,0.18);
// }

// /* ============================================================
//    RUN BUTTONS
// ============================================================ */

// .run-buttons {
//   display: grid;

//   grid-template-columns:
//     repeat(6, 1fr);

//   gap: 9px;
// }

// .run-button {
//   height: 62px;

//   border: 1px solid
//     rgba(255,255,255,0.08);

//   border-radius: 13px;

//   background:
//     rgba(255,255,255,0.04);

//   color: white;

//   font-size: 21px;

//   font-weight: 900;

//   cursor: pointer;

//   transition: 0.18s ease;
// }

// .run-button:hover {
//   transform: translateY(-2px);

//   border-color:
//     rgba(108,99,255,0.4);

//   background:
//     rgba(108,99,255,0.1);
// }

// .run-4 {
//   color: #9d97ff;
// }

// .run-6 {
//   color: #61e9b8;
// }

// .run-button:disabled,
// .special-button:disabled {
//   opacity: 0.4;

//   cursor: not-allowed;

//   transform: none;
// }

// /* ============================================================
//    SPECIAL BUTTONS
// ============================================================ */

// .special-buttons {
//   display: grid;

//   grid-template-columns:
//     repeat(3, 1fr);

//   gap: 9px;

//   margin-top: 10px;
// }

// .special-button {
//   min-height: 65px;

//   border-radius: 13px;

//   cursor: pointer;

//   border: 1px solid
//     rgba(255,255,255,0.08);

//   background:
//     rgba(255,255,255,0.035);

//   color: white;

//   font-size: 18px;

//   font-weight: 900;

//   transition: 0.18s ease;
// }

// .special-button span {
//   display: block;

//   margin-top: 3px;

//   font-size: 9px;

//   font-weight: 700;

//   color: #687286;
// }

// .special-button:hover {
//   transform: translateY(-2px);
// }

// .special-button.wide:hover {
//   border-color:
//     rgba(255,190,80,0.35);
// }

// .special-button.noball:hover {
//   border-color:
//     rgba(255,130,70,0.35);
// }

// .special-button.wicket {
//   color: #ff7f8c;
// }

// .special-button.wicket:hover {
//   border-color:
//     rgba(255,75,95,0.35);
// }

// /* ============================================================
//    MANUAL EXCEPTION TOGGLE
// ============================================================ */

// .manual-exception-wrapper {
//   margin-top: 15px;
// }

// .manual-exception-toggle {
//   width: 100%;

//   display: flex;

//   align-items: center;

//   justify-content: space-between;

//   padding: 15px 17px;

//   border-radius: 14px;

//   border:
//     1px solid rgba(108,99,255,0.17);

//   background:
//     linear-gradient(
//       135deg,
//       rgba(108,99,255,0.08),
//       rgba(139,92,246,0.04)
//     );

//   color: white;

//   cursor: pointer;

//   transition: 0.2s ease;
// }

// .manual-exception-toggle:hover,
// .manual-exception-toggle.active {
//   border-color:
//     rgba(108,99,255,0.4);

//   background:
//     linear-gradient(
//       135deg,
//       rgba(108,99,255,0.13),
//       rgba(139,92,246,0.07)
//     );
// }

// .manual-toggle-left {
//   display: flex;

//   align-items: center;

//   gap: 12px;

//   text-align: left;
// }

// .manual-toggle-icon {
//   width: 38px;
//   height: 38px;

//   display: grid;
//   place-items: center;

//   border-radius: 10px;

//   color: #a19aff;

//   background:
//     rgba(108,99,255,0.12);
// }

// .manual-toggle-left strong {
//   display: block;

//   font-size: 13px;
// }

// .manual-toggle-left span {
//   display: block;

//   margin-top: 3px;

//   color: #737e91;

//   font-size: 10px;
// }

// .manual-exception-toggle > svg {
//   color: #7c86a0;

//   transition: 0.2s ease;
// }

// .manual-exception-toggle > svg.rotate {
//   transform: rotate(180deg);
// }

// /* ============================================================
//    MANUAL EXCEPTION PANEL
// ============================================================ */

// .manual-exception-panel {
//   margin-top: 8px;

//   padding: 20px;

//   border-radius: 17px;

//   border:
//     1px solid rgba(108,99,255,0.18);

//   background:
//     linear-gradient(
//       145deg,
//       rgba(20,24,37,0.98),
//       rgba(13,17,26,0.98)
//     );

//   box-shadow:
//     0 25px 70px
//     rgba(0,0,0,0.28);
// }

// .exception-header {
//   display: flex;

//   align-items: flex-start;

//   justify-content: space-between;

//   gap: 20px;

//   padding-bottom: 17px;

//   border-bottom:
//     1px solid rgba(255,255,255,0.07);
// }

// .exception-header h4 {
//   margin: 0;

//   font-size: 17px;
// }

// .exception-header p {
//   max-width: 600px;

//   margin: 6px 0 0;

//   color: #747f93;

//   font-size: 11px;

//   line-height: 1.6;
// }

// .exception-warning {
//   display: flex;

//   align-items: center;

//   gap: 7px;

//   padding: 8px 10px;

//   border-radius: 9px;

//   color: #ffc875;

//   background:
//     rgba(255,185,70,0.07);

//   border:
//     1px solid rgba(255,185,70,0.12);

//   font-size: 10px;

//   white-space: nowrap;
// }

// /* ============================================================
//    QUICK EXCEPTIONS
// ============================================================ */

// .exception-section {
//   padding: 18px 0;
// }

// .exception-section-title {
//   margin-bottom: 10px;

//   color: #8b95a9;

//   font-size: 10px;

//   font-weight: 800;

//   letter-spacing: 1.1px;

//   text-transform: uppercase;
// }

// .exception-quick-grid {
//   display: grid;

//   grid-template-columns:
//     repeat(6, 1fr);

//   gap: 8px;
// }

// .exception-quick-grid button {
//   min-height: 70px;

//   padding: 10px;

//   text-align: left;

//   border-radius: 11px;

//   border:
//     1px solid rgba(255,255,255,0.07);

//   background:
//     rgba(255,255,255,0.035);

//   color: white;

//   cursor: pointer;

//   transition: 0.18s ease;
// }

// .exception-quick-grid button:hover {
//   transform: translateY(-2px);

//   border-color:
//     rgba(108,99,255,0.4);

//   background:
//     rgba(108,99,255,0.08);
// }

// .exception-quick-grid strong {
//   display: block;

//   font-size: 12px;

//   color: #a29cff;
// }

// .exception-quick-grid span {
//   display: block;

//   margin-top: 5px;

//   color: #687286;

//   font-size: 9px;

//   line-height: 1.4;
// }

// /* ============================================================
//    FORM
// ============================================================ */

// .exception-form-grid {
//   display: grid;

//   grid-template-columns:
//     1fr 1fr 1fr;

//   gap: 12px;

//   margin-bottom: 12px;
// }

// .exception-field {
//   display: flex;

//   flex-direction: column;

//   gap: 7px;
// }

// .exception-field label {
//   color: #8993a6;

//   font-size: 10px;

//   font-weight: 800;

//   text-transform: uppercase;

//   letter-spacing: 0.7px;
// }

// .exception-field label span {
//   color: #596477;

//   font-weight: 500;

//   text-transform: none;

//   letter-spacing: 0;
// }

// .exception-field input,
// .exception-field select {
//   width: 100%;

//   box-sizing: border-box;

//   padding: 11px 12px;

//   border-radius: 10px;

//   border:
//     1px solid rgba(255,255,255,0.08);

//   background:
//     #0b1018;

//   color: #ffffff;

//   font-size: 13px;
// }

// .exception-field select {
//   appearance: auto;

//   cursor: pointer;
// }

// .checkbox-field {
//   justify-content: flex-start;
// }

// .exception-checkbox {
//   height: 42px;

//   display: flex !important;

//   flex-direction: row !important;

//   align-items: center;

//   gap: 10px;

//   padding: 0 12px;

//   border-radius: 10px;

//   border:
//     1px solid rgba(255,255,255,0.08);

//   background:
//     #0b1018;

//   cursor: pointer;

//   color: #d6dce7 !important;

//   text-transform: none !important;

//   letter-spacing: 0 !important;

//   font-size: 12px !important;
// }

// .exception-checkbox input {
//   display: none;
// }

// .custom-checkbox {
//   width: 17px;
//   height: 17px;

//   display: grid;
//   place-items: center;

//   border-radius: 5px;

//   border:
//     1px solid #495366;

//   color: transparent;

//   background:
//     #111722;
// }

// .exception-checkbox
// input:checked
// +
// .custom-checkbox {
//   color: white;

//   border-color: #6c63ff;

//   background: #6c63ff;
// }

// /* ============================================================
//    PREVIEW
// ============================================================ */

// .exception-preview {
//   display: grid;

//   grid-template-columns:
//     2fr 1fr 1fr 1.2fr;

//   align-items: center;

//   gap: 10px;

//   padding: 14px;

//   margin-top: 15px;

//   border-radius: 13px;

//   background:
//     rgba(5,8,14,0.65);

//   border:
//     1px solid rgba(255,255,255,0.07);
// }

// .preview-left span,
// .preview-stat span {
//   display: block;

//   color: #596477;

//   font-size: 8px;

//   font-weight: 800;

//   letter-spacing: 1px;
// }

// .preview-left strong,
// .preview-stat strong {
//   display: block;

//   margin-top: 5px;

//   color: white;

//   font-size: 14px;
// }

// .preview-stat {
//   padding-left: 14px;

//   border-left:
//     1px solid rgba(255,255,255,0.07);
// }

// .preview-stat strong.legal {
//   color: #55e5b0;
// }

// .preview-stat strong.illegal {
//   color: #ffc875;
// }

// /* ============================================================
//    ACTIONS
// ============================================================ */

// .exception-actions {
//   display: flex;

//   justify-content: flex-end;

//   gap: 9px;

//   margin-top: 15px;
// }

// .exception-cancel-button,
// .record-exception-button {
//   min-height: 40px;

//   padding: 0 15px;

//   border-radius: 10px;

//   cursor: pointer;

//   font-size: 12px;

//   font-weight: 800;
// }

// .exception-cancel-button {
//   color: #a4adbd;

//   border:
//     1px solid rgba(255,255,255,0.08);

//   background:
//     rgba(255,255,255,0.04);
// }

// .record-exception-button {
//   display: inline-flex;

//   align-items: center;

//   justify-content: center;

//   gap: 7px;

//   color: white;

//   border: 0;

//   background:
//     linear-gradient(
//       135deg,
//       #6c63ff,
//       #8b5cf6
//     );

//   box-shadow:
//     0 10px 30px
//     rgba(108,99,255,0.2);
// }

// .record-exception-button:disabled {
//   opacity: 0.45;

//   cursor: not-allowed;
// }

// /* ============================================================
//    RECENT HISTORY
// ============================================================ */

// .history-list {
//   display: flex;

//   flex-direction: column;

//   gap: 7px;
// }

// .history-item {
//   display: grid;

//   grid-template-columns:
//     45px 1fr 70px 70px auto;

//   align-items: center;

//   gap: 10px;

//   padding: 10px 12px;

//   border-radius: 11px;

//   background:
//     rgba(255,255,255,0.025);

//   border:
//     1px solid rgba(255,255,255,0.05);
// }

// .history-ball {
//   width: 35px;
//   height: 35px;

//   display: grid;
//   place-items: center;

//   border-radius: 50%;

//   background:
//     rgba(255,255,255,0.06);

//   font-size: 11px;

//   font-weight: 900;
// }

// .history-wicket {
//   color: #ff7f8c;
// }

// .history-details strong {
//   display: block;

//   font-size: 12px;
// }

// .history-details span {
//   display: block;

//   margin-top: 3px;

//   color: #687286;

//   font-size: 10px;
// }

// .history-runs span {
//   display: block;

//   color: #596477;

//   font-size: 8px;
// }

// .history-runs strong {
//   display: block;

//   margin-top: 2px;

//   font-size: 12px;
// }

// .legal-badge {
//   padding: 5px 8px;

//   border-radius: 7px;

//   font-size: 9px;

//   font-weight: 800;

//   text-align: center;
// }

// .legal-badge.legal {
//   color: #59e4b0;

//   background:
//     rgba(53,228,165,0.08);
// }

// .legal-badge.illegal {
//   color: #ffc875;

//   background:
//     rgba(255,190,70,0.08);
// }

// .empty-history {
//   padding: 25px;

//   text-align: center;

//   color: #626c7f;

//   font-size: 12px;
// }

// .undo-button {
//   margin-top: 12px;

//   display: inline-flex;

//   align-items: center;

//   gap: 7px;

//   padding: 8px 11px;

//   border-radius: 9px;

//   border:
//     1px solid rgba(255,255,255,0.08);

//   background:
//     rgba(255,255,255,0.035);

//   color: #8b95a8;

//   cursor: pointer;

//   font-size: 10px;
// }

// /* ============================================================
//    CONTROL CARDS
// ============================================================ */

// .control-card {
//   display: flex;

//   align-items: center;

//   justify-content: space-between;

//   gap: 20px;
// }

// .control-card-info {
//   display: flex;

//   align-items: center;

//   gap: 13px;
// }

// .control-icon {
//   width: 42px;
//   height: 42px;

//   display: grid;
//   place-items: center;

//   border-radius: 12px;

//   color: #9d96ff;

//   background:
//     rgba(108,99,255,0.1);
// }

// .control-card h3,
// .complete-match-card h3 {
//   margin: 0;

//   font-size: 15px;
// }

// .control-card p,
// .complete-match-card p {
//   margin: 4px 0 0;

//   color: #6e788b;

//   font-size: 11px;
// }

// .complete-match-card {
//   display: flex;

//   align-items: center;

//   justify-content: space-between;

//   gap: 20px;

//   padding: 20px;

//   border-radius: 17px;

//   border:
//     1px solid rgba(255,80,100,0.12);

//   background:
//     rgba(255,70,90,0.035);
// }

// .complete-button {
//   color: white;

//   background:
//     linear-gradient(
//       135deg,
//       #dc4358,
//       #b82d43
//     );

//   box-shadow:
//     0 10px 30px
//     rgba(220,67,88,0.15);
// }

// .complete-button:disabled {
//   opacity: 0.45;

//   cursor: not-allowed;
// }

// /* ============================================================
//    LOADING
// ============================================================ */

// .loading-overlay {
//   position: fixed;

//   inset: 0;

//   z-index: 1000;

//   display: grid;

//   place-items: center;

//   background:
//     rgba(3,5,9,0.72);

//   backdrop-filter: blur(10px);
// }

// .loading-card {
//   min-width: 210px;

//   padding: 25px;

//   display: flex;

//   flex-direction: column;

//   align-items: center;

//   gap: 8px;

//   border-radius: 17px;

//   border:
//     1px solid rgba(255,255,255,0.09);

//   background:
//     #111620;

//   box-shadow:
//     0 30px 80px
//     rgba(0,0,0,0.4);
// }

// .loading-card strong {
//   font-size: 13px;
// }

// .loading-card span {
//   color: #697386;

//   font-size: 10px;
// }

// .loading-spinner {
//   width: 28px;
//   height: 28px;

//   margin-bottom: 4px;

//   border-radius: 50%;

//   border:
//     3px solid rgba(255,255,255,0.1);

//   border-top-color: #7b72ff;

//   animation:
//     spin 0.8s linear infinite;
// }

// @keyframes spin {
//   to {
//     transform: rotate(360deg);
//   }
// }

// /* ============================================================
//    RESPONSIVE
// ============================================================ */

// @media (max-width: 1000px) {

//   .players-grid {
//     grid-template-columns:
//       1fr 1fr;
//   }

//   .bowler-card {
//     grid-column:
//       1 / -1;
//   }

//   .exception-quick-grid {
//     grid-template-columns:
//       repeat(3, 1fr);
//   }

// }

// @media (max-width: 760px) {

//   .scoreboard-header {
//     padding: 13px 17px;
//   }

//   .header-right {
//     display: none;
//   }

//   .back-button {
//     font-size: 0;
//   }

//   .back-button svg {
//     width: 19px;
//     height: 19px;
//   }

//   .scoreboard-container {
//     width:
//       calc(100% - 24px);

//     padding-top: 18px;
//   }

//   .match-selector-card {
//     flex-direction: column;

//     align-items: stretch;
//   }

//   .select-wrapper {
//     width: 100%;
//   }

//   .start-match-card,
//   .completed-card {
//     flex-direction: column;

//     align-items: flex-start;
//   }

//   .start-match-content {
//     width: 100%;
//   }

//   .start-button,
//   .completed-card .secondary-button {
//     width: 100%;
//   }

//   .players-grid {
//     grid-template-columns: 1fr;
//   }

//   .bowler-card {
//     grid-column: auto;
//   }

//   .new-bowler-card {
//     grid-template-columns: auto 1fr;
//   }

//   .new-bowler-form {
//     grid-column:
//       1 / -1;
//   }

//   .new-bowler-form input {
//     flex: 1;
//   }

//   .score-main {
//     flex-direction: column;

//     gap: 10px;
//   }

//   .score-teams {
//     grid-template-columns:
//       1fr;

//     text-align: left;
//   }

//   .team-right {
//     text-align: left;
//   }

//   .vs-circle {
//     display: none;
//   }

//   .run-buttons {
//     grid-template-columns:
//       repeat(3, 1fr);
//   }

//   .special-buttons {
//     grid-template-columns:
//       1fr;
//   }

//   .exception-header {
//     flex-direction: column;
//   }

//   .exception-warning {
//     white-space: normal;
//   }

//   .exception-quick-grid {
//     grid-template-columns:
//       1fr 1fr;
//   }

//   .exception-form-grid {
//     grid-template-columns:
//       1fr;
//   }

//   .exception-preview {
//     grid-template-columns:
//       1fr 1fr;
//   }

//   .preview-stat {
//     padding-left: 0;

//     padding-top: 10px;

//     border-left: 0;

//     border-top:
//       1px solid rgba(255,255,255,0.07);
//   }

//   .history-item {
//     grid-template-columns:
//       40px 1fr auto;

//   }

//   .history-runs {
//     display: none;
//   }

//   .control-card,
//   .complete-match-card {
//     flex-direction: column;

//     align-items: flex-start;
//   }

//   .control-card .secondary-button,
//   .complete-match-card .complete-button {
//     width: 100%;
//   }

// }

// @media (max-width: 480px) {

//   .scoreboard-container {
//     width:
//       calc(100% - 16px);
//   }

//   .score-hero {
//     padding: 21px;
//   }

//   .big-score {
//     font-size: 58px;
//   }

//   .exception-quick-grid {
//     grid-template-columns:
//       1fr;
//   }

//   .exception-actions {
//     flex-direction: column;
//   }

//   .exception-actions button {
//     width: 100%;
//   }

// }`}</style>
//     </div>
//   );
// }
