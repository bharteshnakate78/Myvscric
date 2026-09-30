package mycric.controller;

import mycric.dto.InningsRequest;
import mycric.dto.ScoreUpdateRequest;
import mycric.entity.Innings;
import mycric.entity.Match;
import mycric.entity.Team;
import mycric.repository.InningsRepository;
import mycric.repository.MatchRepository;
import mycric.repository.TeamRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/innings")
@CrossOrigin(origins = {
                "http://localhost:5173",
                "http://localhost:3000"
})
public class InningsController {

        private final InningsRepository inningsRepository;
        private final MatchRepository matchRepository;
        private final TeamRepository teamRepository;

        public InningsController(
                        InningsRepository inningsRepository,
                        MatchRepository matchRepository,
                        TeamRepository teamRepository) {

                this.inningsRepository = inningsRepository;
                this.matchRepository = matchRepository;
                this.teamRepository = teamRepository;
        }

        // =========================================================
        // GET ALL INNINGS
        // =========================================================

        @GetMapping
        public ResponseEntity<List<Innings>> getAllInnings() {

                return ResponseEntity.ok(
                                inningsRepository.findAll());
        }

        // =========================================================
        // GET INNINGS BY ID
        // =========================================================

        @GetMapping("/{id}")
        public ResponseEntity<?> getInningsById(
                        @PathVariable Long id) {

                return inningsRepository.findById(id)
                                .map(ResponseEntity::ok)
                                .orElseGet(() -> ResponseEntity.notFound().build());
        }

        // =========================================================
        // GET ALL INNINGS OF MATCH
        // =========================================================

        @GetMapping("/match/{matchId}")
        public ResponseEntity<?> getInningsByMatch(
                        @PathVariable Long matchId) {

                try {

                        if (!matchRepository.existsById(matchId)) {
                                return ResponseEntity
                                                .status(HttpStatus.NOT_FOUND)
                                                .body("Match not found");
                        }

                        List<Innings> innings = inningsRepository
                                        .findByMatch_IdOrderByInningsNumberAsc(matchId);

                        return ResponseEntity.ok(innings);

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body("Unable to load innings: " + e.getMessage());
                }
        }

        // =========================================================
        // GET CURRENT INNINGS
        //
        // IMPORTANT:
        // Frontend calls:
        // GET /api/innings/current/{matchId}
        // =========================================================

        @GetMapping("/current/{matchId}")
        public ResponseEntity<?> getCurrentInnings(
                        @PathVariable Long matchId) {

                try {

                        if (!matchRepository.existsById(matchId)) {

                                return ResponseEntity
                                                .status(HttpStatus.NOT_FOUND)
                                                .body("Match not found");
                        }

                        List<Innings> innings = inningsRepository
                                        .findByMatch_IdOrderByInningsNumberAsc(matchId);

                        if (innings == null || innings.isEmpty()) {

                                return ResponseEntity
                                                .status(HttpStatus.NOT_FOUND)
                                                .body("No innings found for this match");
                        }

                        // First look for LIVE innings
                        for (Innings inningsItem : innings) {

                                if ("LIVE".equalsIgnoreCase(
                                                inningsItem.getStatus())) {

                                        return ResponseEntity.ok(inningsItem);
                                }
                        }

                        // If no LIVE innings exists,
                        // return the latest innings.
                        Innings latest = innings.get(
                                        innings.size() - 1);

                        return ResponseEntity.ok(latest);

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(
                                                        "Unable to get current innings: "
                                                                        + e.getMessage());
                }
        }

        // =========================================================
        // CREATE INNINGS
        // =========================================================

        @PostMapping
        public ResponseEntity<?> createInnings(
                        @RequestBody InningsRequest request) {

                try {

                        // -------------------------------------------------
                        // VALIDATION
                        // -------------------------------------------------

                        if (request == null) {

                                return ResponseEntity
                                                .badRequest()
                                                .body("Request body is required");
                        }

                        if (request.getMatchId() == null) {

                                return ResponseEntity
                                                .badRequest()
                                                .body("matchId is required");
                        }

                        if (request.getBattingTeamId() == null) {

                                return ResponseEntity
                                                .badRequest()
                                                .body("battingTeamId is required");
                        }

                        if (request.getBowlingTeamId() == null) {

                                return ResponseEntity
                                                .badRequest()
                                                .body("bowlingTeamId is required");
                        }

                        if (request.getBattingTeamId()
                                        .equals(request.getBowlingTeamId())) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                "Batting team and bowling team cannot be the same");
                        }

                        // -------------------------------------------------
                        // FIND MATCH
                        // -------------------------------------------------

                        Match match = matchRepository.findById(
                                        request.getMatchId()).orElse(null);

                        if (match == null) {

                                return ResponseEntity
                                                .status(HttpStatus.NOT_FOUND)
                                                .body("Match not found");
                        }

                        // -------------------------------------------------
                        // FIND BATTING TEAM
                        // -------------------------------------------------

                        Team battingTeam = teamRepository.findById(
                                        request.getBattingTeamId()).orElse(null);

                        if (battingTeam == null) {

                                return ResponseEntity
                                                .status(HttpStatus.NOT_FOUND)
                                                .body("Batting team not found");
                        }

                        // -------------------------------------------------
                        // FIND BOWLING TEAM
                        // -------------------------------------------------

                        Team bowlingTeam = teamRepository.findById(
                                        request.getBowlingTeamId()).orElse(null);

                        if (bowlingTeam == null) {

                                return ResponseEntity
                                                .status(HttpStatus.NOT_FOUND)
                                                .body("Bowling team not found");
                        }

                        // -------------------------------------------------
                        // VERIFY TEAMS BELONG TO MATCH
                        // -------------------------------------------------

                        Long teamAId = match.getTeamA() != null
                                        ? match.getTeamA().getId()
                                        : null;

                        Long teamBId = match.getTeamB() != null
                                        ? match.getTeamB().getId()
                                        : null;

                        boolean battingTeamInMatch = request.getBattingTeamId().equals(teamAId)
                                        ||
                                        request.getBattingTeamId().equals(teamBId);

                        boolean bowlingTeamInMatch = request.getBowlingTeamId().equals(teamAId)
                                        ||
                                        request.getBowlingTeamId().equals(teamBId);

                        if (!battingTeamInMatch ||
                                        !bowlingTeamInMatch) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                "Both teams must belong to the selected match");
                        }

                        // -------------------------------------------------
                        // INNINGS NUMBER
                        // -------------------------------------------------

                        int inningsNumber = request.getInningsNumber() != null
                                        ? request.getInningsNumber()
                                        : 1;

                        // -------------------------------------------------
                        // PREVENT DUPLICATE
                        // -------------------------------------------------

                        if (inningsRepository
                                        .findByMatch_IdAndInningsNumber(
                                                        request.getMatchId(),
                                                        inningsNumber)
                                        .isPresent()) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                "Innings "
                                                                                + inningsNumber
                                                                                + " already exists for this match");
                        }

                        // -------------------------------------------------
                        // CREATE
                        // -------------------------------------------------

                        Innings innings = new Innings();

                        innings.setMatch(match);

                        innings.setBattingTeam(
                                        battingTeam);

                        innings.setBowlingTeam(
                                        bowlingTeam);

                        innings.setInningsNumber(
                                        inningsNumber);

                        innings.setBalls(0);
                        innings.setOvers(0);
                        innings.setRuns(0);
                        innings.setWickets(0);

                        innings.setTarget(
                                        request.getTarget() != null
                                                        ? request.getTarget()
                                                        : 0);

                        innings.setStatus("LIVE");

                        Innings saved = inningsRepository.save(innings);

                        return ResponseEntity
                                        .status(HttpStatus.CREATED)
                                        .body(saved);

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(
                                                        "Failed to create innings: "
                                                                        + e.getMessage());
                }
        }

        // =========================================================
        // UPDATE INNINGS SCORE
        // =========================================================

        @PutMapping("/{id}/score")
        public ResponseEntity<?> updateScore(
                        @PathVariable Long id,
                        @RequestBody ScoreUpdateRequest request) {

                try {

                        Innings innings = inningsRepository.findById(id)
                                        .orElse(null);

                        if (innings == null) {

                                return ResponseEntity
                                                .status(HttpStatus.NOT_FOUND)
                                                .body("Innings not found: " + id);
                        }

                        if ("COMPLETED".equalsIgnoreCase(
                                        innings.getStatus())) {

                                return ResponseEntity
                                                .badRequest()
                                                .body("This innings is already completed");
                        }

                        // -------------------------------------------------
                        // CURRENT VALUES
                        // -------------------------------------------------

                        int currentRuns = innings.getRuns() != null
                                        ? innings.getRuns()
                                        : 0;

                        int currentWickets = innings.getWickets() != null
                                        ? innings.getWickets()
                                        : 0;

                        int currentBalls = innings.getBalls() != null
                                        ? innings.getBalls()
                                        : 0;

                        // -------------------------------------------------
                        // ADDED VALUES
                        // -------------------------------------------------

                        int addedRuns = request.getRuns() != null
                                        ? request.getRuns()
                                        : 0;

                        int addedWickets = request.getWickets() != null
                                        ? request.getWickets()
                                        : 0;

                        boolean legalBall = Boolean.TRUE.equals(
                                        request.getLegalBall());

                        // -------------------------------------------------
                        // CALCULATE
                        // -------------------------------------------------

                        int newRuns = currentRuns + addedRuns;

                        int newWickets = currentWickets + addedWickets;

                        int newBalls = currentBalls;

                        if (legalBall) {
                                newBalls++;
                        }

                        // -------------------------------------------------
                        // SAVE VALUES
                        // -------------------------------------------------

                        innings.setRuns(newRuns);

                        innings.setWickets(newWickets);

                        innings.setBalls(newBalls);

                        // Number of completed overs
                        innings.setOvers(newBalls / 6);

                        // -------------------------------------------------
                        // CHECK END
                        // -------------------------------------------------

                        Integer target = innings.getTarget();

                        boolean targetReached = target != null
                                        && target > 0
                                        && newRuns >= target;

                        boolean allOut = newWickets >= 10;

                        if (targetReached || allOut) {

                                innings.setStatus("COMPLETED");

                        } else {

                                innings.setStatus("LIVE");
                        }

                        // -------------------------------------------------
                        // SAVE
                        // -------------------------------------------------

                        Innings saved = inningsRepository.save(innings);

                        return ResponseEntity.ok(saved);

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(
                                                        "Score update failed: "
                                                                        + e.getMessage());
                }
        }

        // =========================================================
        // COMPLETE INNINGS
        // =========================================================

        @PutMapping("/{id}/complete")
        public ResponseEntity<?> completeInnings(
                        @PathVariable Long id) {

                try {

                        Innings innings = inningsRepository.findById(id)
                                        .orElse(null);

                        if (innings == null) {

                                return ResponseEntity
                                                .status(HttpStatus.NOT_FOUND)
                                                .body(
                                                                "Innings not found: " + id);
                        }

                        innings.setStatus("COMPLETED");

                        Innings saved = inningsRepository.save(innings);

                        return ResponseEntity.ok(saved);

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(
                                                        "Unable to complete innings: "
                                                                        + e.getMessage());
                }
        }

        // =========================================================
        // DELETE
        // =========================================================

        @DeleteMapping("/{id}")
        public ResponseEntity<?> deleteInnings(
                        @PathVariable Long id) {

                try {

                        if (!inningsRepository.existsById(id)) {

                                return ResponseEntity
                                                .status(HttpStatus.NOT_FOUND)
                                                .body("Innings not found");
                        }

                        inningsRepository.deleteById(id);

                        return ResponseEntity.ok(
                                        "Innings deleted successfully");

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(
                                                        "Unable to delete innings: "
                                                                        + e.getMessage());
                }
        }
}

// package mycric.controller;

// import mycric.dto.InningsRequest;
// import mycric.dto.ScoreUpdateRequest;
// import mycric.entity.Innings;
// import mycric.entity.Match;
// import mycric.entity.Team;
// import mycric.repository.InningsRepository;
// import mycric.repository.MatchRepository;
// import mycric.repository.TeamRepository;

// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;

// @RestController
// @RequestMapping("/api/innings")
// @CrossOrigin(origins = "http://localhost:5173")
// public class InningsController {

// private final InningsRepository inningsRepository;
// private final MatchRepository matchRepository;
// private final TeamRepository teamRepository;

// public InningsController(
// InningsRepository inningsRepository,
// MatchRepository matchRepository,
// TeamRepository teamRepository) {
// this.inningsRepository = inningsRepository;
// this.matchRepository = matchRepository;
// this.teamRepository = teamRepository;
// }

// // =========================================================
// // GET ALL INNINGS
// // =========================================================

// @GetMapping
// public ResponseEntity<List<Innings>> getAllInnings() {

// return ResponseEntity.ok(
// inningsRepository.findAll());
// }

// // =========================================================
// // GET INNINGS BY ID
// // =========================================================

// @GetMapping("/{id}")
// public ResponseEntity<?> getInningsById(
// @PathVariable Long id) {

// return inningsRepository.findById(id)
// .map(ResponseEntity::ok)
// .orElseGet(() -> ResponseEntity.notFound().build());
// }

// // =========================================================
// // GET INNINGS BY MATCH
// // =========================================================

// @GetMapping("/match/{matchId}")
// public ResponseEntity<List<Innings>> getInningsByMatch(
// @PathVariable Long matchId) {

// return ResponseEntity.ok(
// inningsRepository
// .findByMatch_IdOrderByInningsNumberAsc(matchId));
// }

// // =========================================================
// // CREATE INNINGS
// // =========================================================

// @PostMapping
// public ResponseEntity<?> createInnings(
// @RequestBody InningsRequest request) {

// try {

// // -------------------------------------------------
// // VALIDATION
// // -------------------------------------------------

// if (request.getMatchId() == null) {
// return ResponseEntity.badRequest()
// .body("matchId is required");
// }

// if (request.getBattingTeamId() == null) {
// return ResponseEntity.badRequest()
// .body("battingTeamId is required");
// }

// if (request.getBowlingTeamId() == null) {
// return ResponseEntity.badRequest()
// .body("bowlingTeamId is required");
// }

// if (request.getBattingTeamId()
// .equals(request.getBowlingTeamId())) {

// return ResponseEntity.badRequest()
// .body(
// "Batting team and bowling team " +
// "cannot be the same");
// }

// // -------------------------------------------------
// // FIND MATCH
// // -------------------------------------------------

// Match match = matchRepository.findById(
// request.getMatchId()).orElse(null);

// if (match == null) {

// return ResponseEntity.badRequest()
// .body("Match not found");
// }

// // -------------------------------------------------
// // FIND BATTING TEAM
// // -------------------------------------------------

// Team battingTeam = teamRepository.findById(
// request.getBattingTeamId()).orElse(null);

// if (battingTeam == null) {

// return ResponseEntity.badRequest()
// .body("Batting team not found");
// }

// // -------------------------------------------------
// // FIND BOWLING TEAM
// // -------------------------------------------------

// Team bowlingTeam = teamRepository.findById(
// request.getBowlingTeamId()).orElse(null);

// if (bowlingTeam == null) {

// return ResponseEntity.badRequest()
// .body("Bowling team not found");
// }

// // -------------------------------------------------
// // VERIFY TEAMS BELONG TO MATCH
// // -------------------------------------------------

// boolean battingTeamInMatch = match.getTeamA().getId()
// .equals(request.getBattingTeamId())
// ||
// match.getTeamB().getId()
// .equals(request.getBattingTeamId());

// boolean bowlingTeamInMatch = match.getTeamA().getId()
// .equals(request.getBowlingTeamId())
// ||
// match.getTeamB().getId()
// .equals(request.getBowlingTeamId());

// if (!battingTeamInMatch ||
// !bowlingTeamInMatch) {

// return ResponseEntity.badRequest()
// .body(
// "Teams must belong to the selected match");
// }

// // -------------------------------------------------
// // INNINGS NUMBER
// // -------------------------------------------------

// int inningsNumber = request.getInningsNumber() != null
// ? request.getInningsNumber()
// : 1;

// // -------------------------------------------------
// // PREVENT DUPLICATE INNINGS
// // -------------------------------------------------

// if (inningsRepository
// .findByMatch_IdAndInningsNumber(
// request.getMatchId(),
// inningsNumber)
// .isPresent()) {

// return ResponseEntity.badRequest()
// .body(
// "Innings " +
// inningsNumber +
// " already exists for this match");
// }

// // -------------------------------------------------
// // CREATE
// // -------------------------------------------------

// Innings innings = new Innings();

// innings.setMatch(match);

// innings.setBattingTeam(
// battingTeam);

// innings.setBowlingTeam(
// bowlingTeam);

// innings.setInningsNumber(
// inningsNumber);

// innings.setBalls(0);
// innings.setOvers(0);
// innings.setRuns(0);
// innings.setWickets(0);

// innings.setTarget(
// request.getTarget() != null
// ? request.getTarget()
// : 0);

// innings.setStatus("LIVE");

// Innings saved = inningsRepository.save(innings);

// return ResponseEntity
// .status(HttpStatus.CREATED)
// .body(saved);

// } catch (Exception e) {

// e.printStackTrace();

// return ResponseEntity
// .status(HttpStatus.INTERNAL_SERVER_ERROR)
// .body(
// "Failed to create innings: "
// + e.getMessage());
// }
// }

// // =========================================================
// // UPDATE SCORE
// // =========================================================

// @PutMapping("/{id}/score")
// public ResponseEntity<?> updateScore(
// @PathVariable Long id,
// @RequestBody ScoreUpdateRequest request) {

// try {

// Innings innings = inningsRepository.findById(id)
// .orElse(null);

// if (innings == null) {
// return ResponseEntity.notFound().build();
// }

// // -------------------------------------------------
// // CURRENT VALUES
// // -------------------------------------------------

// int currentRuns = innings.getRuns() != null
// ? innings.getRuns()
// : 0;

// int currentWickets = innings.getWickets() != null
// ? innings.getWickets()
// : 0;

// int currentBalls = innings.getBalls() != null
// ? innings.getBalls()
// : 0;

// // -------------------------------------------------
// // NEW VALUES
// // -------------------------------------------------

// int addedRuns = request.getRuns() != null
// ? request.getRuns()
// : 0;

// int addedWickets = request.getWickets() != null
// ? request.getWickets()
// : 0;

// boolean legalBall = Boolean.TRUE.equals(
// request.getLegalBall());

// // -------------------------------------------------
// // UPDATE RUNS
// // -------------------------------------------------

// int newRuns = currentRuns + addedRuns;

// innings.setRuns(newRuns);

// // -------------------------------------------------
// // UPDATE WICKETS
// // -------------------------------------------------

// int newWickets = currentWickets + addedWickets;

// innings.setWickets(newWickets);

// // -------------------------------------------------
// // UPDATE BALLS
// // -------------------------------------------------

// int newBalls = currentBalls;

// if (legalBall) {
// newBalls++;
// }

// innings.setBalls(newBalls);

// // -------------------------------------------------
// // COMPLETED OVERS
// // -------------------------------------------------

// int completedOvers = newBalls / 6;

// innings.setOvers(
// completedOvers);

// // -------------------------------------------------
// // CHECK INNINGS END
// // -------------------------------------------------

// Integer target = innings.getTarget();

// if (target != null &&
// target > 0 &&
// newRuns >= target) {

// innings.setStatus("COMPLETED");

// } else if (newWickets >= 10) {

// innings.setStatus("COMPLETED");

// } else {

// innings.setStatus("LIVE");
// }

// // -------------------------------------------------
// // SAVE
// // -------------------------------------------------

// Innings updated = inningsRepository.save(innings);

// return ResponseEntity.ok(updated);

// } catch (Exception e) {

// e.printStackTrace();

// return ResponseEntity
// .status(HttpStatus.INTERNAL_SERVER_ERROR)
// .body(
// "Score update failed: "
// + e.getMessage());
// }
// }

// // =========================================================
// // COMPLETE INNINGS
// // =========================================================

// @PutMapping("/{id}/complete")
// public ResponseEntity<?> completeInnings(
// @PathVariable Long id) {

// Innings innings = inningsRepository.findById(id)
// .orElse(null);

// if (innings == null) {
// return ResponseEntity.notFound().build();
// }

// innings.setStatus("COMPLETED");

// return ResponseEntity.ok(
// inningsRepository.save(innings));
// }

// // =========================================================
// // DELETE
// // =========================================================

// @DeleteMapping("/{id}")
// public ResponseEntity<?> deleteInnings(
// @PathVariable Long id) {

// if (!inningsRepository.existsById(id)) {
// return ResponseEntity.notFound().build();
// }

// inningsRepository.deleteById(id);

// return ResponseEntity.ok(
// "Innings deleted successfully");
// }
// }