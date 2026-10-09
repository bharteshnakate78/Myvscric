package mycric.service.impl;

import mycric.dto.ScoreRequest;
import mycric.entity.Innings;
import mycric.entity.MatchBallRecord;
import mycric.entity.Match;
import mycric.entity.Score;
import mycric.entity.Team;
import mycric.repository.InningsRepository;
import mycric.repository.MatchBallRecordRepository;
import mycric.repository.MatchRepository;
import mycric.repository.ScoreRepository;
import mycric.service.ScoreService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ScoreServiceImpl implements ScoreService {

        private final ScoreRepository scoreRepository;
        private final MatchRepository matchRepository;
        private final InningsRepository inningsRepository;
        private final MatchBallRecordRepository ballRecordRepository;

        public ScoreServiceImpl(
                        ScoreRepository scoreRepository,
                        MatchRepository matchRepository,
                        InningsRepository inningsRepository,
                        MatchBallRecordRepository ballRecordRepository) {

                this.scoreRepository = scoreRepository;
                this.matchRepository = matchRepository;
                this.inningsRepository = inningsRepository;
                this.ballRecordRepository = ballRecordRepository;
        }

        // =========================================================
        // SAVE SCORE
        // =========================================================

        @Override
        public Score saveScore(Score score) {
                return scoreRepository.save(score);
        }

        // =========================================================
        // GET ALL SCORES
        // =========================================================

        @Override
        @Transactional(readOnly = true)
        public List<Score> getAllScores() {
                return scoreRepository.findAll();
        }

        // =========================================================
        // GET SCORE BY MATCH
        // =========================================================

        @Override
        @Transactional(readOnly = true)
        public Optional<Score> getScoreByMatch(Long matchId) {

                if (matchId == null) {
                        throw new IllegalArgumentException(
                                        "Match ID is required");
                }

                return scoreRepository.findByMatchId(matchId);
        }

        // =========================================================
        // CREATE SCORE
        // =========================================================

        @Override
        public Score createScore(
                        Long matchId,
                        ScoreRequest request) {

                if (matchId == null) {
                        throw new IllegalArgumentException(
                                        "Match ID is required");
                }

                if (request == null) {
                        throw new IllegalArgumentException(
                                        "Score request cannot be null");
                }

                Match match = matchRepository.findById(matchId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Match not found: " + matchId));

                /*
                 * Make sure innings 1 exists.
                 */
                getOrCreateInnings(match, 1);

                Score score = scoreRepository
                                .findByMatchId(matchId)
                                .orElseGet(() -> {

                                        Score created = new Score();
                                        created.setMatch(match);

                                        /*
                                         * Depending on your Score entity,
                                         * these values may already have defaults.
                                         */
                                        created.setRuns(0);
                                        created.setWickets(0);
                                        created.setOvers(0);

                                        return created;
                                });

                applyRequest(score, request);

                return scoreRepository.save(score);
        }

        // =========================================================
        // UPDATE SCORE
        // =========================================================

        @Override
        public Score updateScore(
                        Long scoreId,
                        ScoreRequest request) {

                if (scoreId == null) {
                        throw new IllegalArgumentException(
                                        "Score ID is required");
                }

                if (request == null) {
                        throw new IllegalArgumentException(
                                        "Score request cannot be null");
                }

                Score score = scoreRepository
                                .findById(scoreId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Score not found: " + scoreId));

                applyRequest(score, request);

                return scoreRepository.save(score);
        }

        // =========================================================
        // RECORD BALL
        // =========================================================

        @Override
        public Score recordBall(ScoreRequest request) {

                if (request == null) {
                        throw new IllegalArgumentException(
                                        "Score request cannot be null");
                }

                if (request.getMatchId() == null) {
                        throw new IllegalArgumentException(
                                        "Match ID is required");
                }

                Long matchId = request.getMatchId();

                Match match = matchRepository.findById(matchId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Match not found: " + matchId));

                /*
                 * =====================================================
                 * FIND CURRENT INNINGS
                 * =====================================================
                 */

                Innings innings = inningsRepository
                                .findTopByMatch_IdOrderByInningsNumberDesc(matchId)
                                .orElseGet(() -> getOrCreateInnings(match, 1));

                /*
                 * =====================================================
                 * CURRENT SCORE
                 * =====================================================
                 */

                Score score = scoreRepository
                                .findByMatchId(matchId)
                                .orElseGet(() -> {

                                        Score created = new Score();

                                        created.setMatch(match);
                                        created.setRuns(0);
                                        created.setWickets(0);
                                        created.setOvers(0);

                                        return created;
                                });

                /*
                 * =====================================================
                 * RUNS
                 * =====================================================
                 */

                int runs = request.getRuns();

                int newRuns = safeInt(score.getRuns()) + runs;

                score.setRuns(newRuns);

                /*
                 * =====================================================
                 * WICKET
                 * =====================================================
                 */

                if (request.isWicket()) {

                        score.setWickets(
                                        safeInt(score.getWickets()) + 1);

                        innings.setWickets(
                                        safeInt(innings.getWickets()) + 1);
                }

                /*
                 * =====================================================
                 * UPDATE INNINGS RUNS
                 * =====================================================
                 */

                innings.setRuns(
                                safeInt(innings.getRuns()) + runs);

                /*
                 * =====================================================
                 * LEGAL BALL
                 * =====================================================
                 *
                 * Wide and no-ball are NOT legal balls.
                 */

                boolean legalBall;

                if (request.getLegalBall() != null) {
                        legalBall = request.getLegalBall();
                } else {
                        String ballType = request.getBallType() == null
                                        ? ""
                                        : request.getBallType().toUpperCase();

                        legalBall = !ballType.startsWith("WD")
                                        && !ballType.startsWith("NB")
                                        && !ballType.startsWith("WIDE")
                                        && !ballType.startsWith("NO_BALL");
                }

                if (legalBall) {

                        int balls = safeInt(innings.getBalls()) + 1;

                        /*
                         * =================================================
                         * OVER COMPLETED
                         * =================================================
                         */

                        if (balls >= 6) {

                                int completedOvers = safeInt(innings.getOvers()) + 1;

                                innings.setOvers(completedOvers);

                                innings.setBalls(0);

                        } else {

                                innings.setBalls(balls);
                        }
                }

                /*
                 * =====================================================
                 * STATUS
                 * =====================================================
                 */

                innings.setStatus("LIVE");

                /*
                 * =====================================================
                 * SCORE OVERS
                 * =====================================================
                 *
                 * Keep Score entity compatible with existing frontend.
                 */

                float scoreOvers = innings.getOvers()
                                + (innings.getBalls() / 10.0f);

                score.setOvers(scoreOvers);

                /*
                 * =====================================================
                 * SAVE BOTH
                 * =====================================================
                 */

                inningsRepository.save(innings);

                // Persist per-delivery batting/bowling details so registered
                // player career stats can be updated when the match is completed.
                MatchBallRecord delivery = new MatchBallRecord();
                delivery.setMatchId(matchId);
                delivery.setInningsNumber(innings.getInningsNumber() == null ? 1 : innings.getInningsNumber());
                delivery.setStrikerName(cleanName(request.getStriker()));
                delivery.setNonStrikerName(cleanName(request.getNonStriker()));
                delivery.setBowlerName(cleanName(request.getBowler()));
                delivery.setBattingTeamId(innings.getBattingTeam() == null ? null : innings.getBattingTeam().getId());
                delivery.setBowlingTeamId(innings.getBowlingTeam() == null ? null : innings.getBowlingTeam().getId());
                int batterRuns = request.getBatsmanRuns() == null
                                ? (isExtraBall(request.getBallType()) ? 0 : Math.max(0, request.getRuns()))
                                : Math.max(0, request.getBatsmanRuns());
                delivery.setBatsmanRuns(batterRuns);
                delivery.setWicket(request.isWicket());
                delivery.setWicketType(request.getWicketType());
                ballRecordRepository.save(delivery);

                return scoreRepository.save(score);
        }

        // =========================================================
        // RECORD WICKET
        // =========================================================

        @Override
        public Score recordWicket(
                        ScoreRequest request) {

                request.setWicket(true);

                return recordBall(request);
        }

        // =========================================================
        // RECORD WIDE
        // =========================================================

        @Override
        public Score recordWide(
                        ScoreRequest request) {

                request.setBallType("WIDE");

                return recordBall(request);
        }

        // =========================================================
        // RECORD NO BALL
        // =========================================================

        @Override
        public Score recordNoBall(
                        ScoreRequest request) {

                request.setBallType("NO_BALL");

                return recordBall(request);
        }

        // =========================================================
        // WIDE + WICKET
        // =========================================================

        @Override
        public Score recordWideWicket(
                        ScoreRequest request) {

                request.setBallType("WIDE");
                request.setWicket(true);

                return recordBall(request);
        }

        // =========================================================
        // NO BALL + WICKET
        // =========================================================

        @Override
        public Score recordNoBallWicket(
                        ScoreRequest request) {

                request.setBallType("NO_BALL");
                request.setWicket(true);

                return recordBall(request);
        }

        // =========================================================
        // UNDO
        // =========================================================

        @Override
        public Score undoLastBall(Long matchId) {

                if (matchId == null) {
                        throw new IllegalArgumentException(
                                        "Match ID is required");
                }

                return getScoreByMatch(matchId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Score not found for match: "
                                                                + matchId));
        }

        // =========================================================
        // RESET SCORE
        // =========================================================

        @Override
        public Score resetScore(Long scoreId) {

                if (scoreId == null) {
                        throw new IllegalArgumentException(
                                        "Score ID is required");
                }

                Score score = scoreRepository
                                .findById(scoreId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Score not found: " + scoreId));

                score.setRuns(0);
                score.setWickets(0);
                score.setOvers(0);

                /*
                 * Reset corresponding innings as well.
                 */

                if (score.getMatch() != null &&
                                score.getMatch().getId() != null) {

                        inningsRepository
                                        .findTopByMatch_IdOrderByInningsNumberDesc(
                                                        score.getMatch().getId())
                                        .ifPresent(innings -> {

                                                innings.setRuns(0);
                                                innings.setWickets(0);
                                                innings.setOvers(0);
                                                innings.setBalls(0);
                                                innings.setStatus("LIVE");

                                                inningsRepository.save(innings);
                                        });
                }

                return scoreRepository.save(score);
        }

        @Override
        public Score resetForNewInnings(Long matchId) {
                if (matchId == null) {
                        throw new IllegalArgumentException("Match ID is required");
                }

                Score score = scoreRepository.findByMatchId(matchId)
                                .orElseGet(() -> {
                                        Match match = matchRepository.findById(matchId)
                                                        .orElseThrow(() -> new IllegalArgumentException(
                                                                        "Match not found: " + matchId));

                                        Score created = new Score();
                                        created.setMatch(match);
                                        return created;
                                });

                score.setRuns(0);
                score.setWickets(0);
                score.setOvers(0);
                score.setStriker(null);
                score.setNonStriker(null);
                score.setBowler(null);

                return scoreRepository.save(score);
        }

        // =========================================================
        // GET OR CREATE INNINGS
        // =========================================================

        private Innings getOrCreateInnings(
                        Match match,
                        int inningsNumber) {

                Long matchId = match.getId();

                Optional<Innings> existing = inningsRepository
                                .findByMatch_IdAndInningsNumber(
                                                matchId,
                                                inningsNumber);

                if (existing.isPresent()) {
                        return existing.get();
                }

                Innings innings = new Innings();

                innings.setMatch(match);
                innings.setInningsNumber(inningsNumber);

                /*
                 * =====================================================
                 * TEAM ASSIGNMENT
                 * =====================================================
                 */

                if (inningsNumber == 1) {

                        innings.setBattingTeam(
                                        match.getTeamA());

                        innings.setBowlingTeam(
                                        match.getTeamB());

                } else {

                        innings.setBattingTeam(
                                        match.getTeamB());

                        innings.setBowlingTeam(
                                        match.getTeamA());
                }

                /*
                 * =====================================================
                 * DEFAULT VALUES
                 * =====================================================
                 */

                innings.setRuns(0);
                innings.setWickets(0);
                innings.setOvers(0);
                innings.setBalls(0);
                innings.setTarget(null);
                innings.setStatus("LIVE");

                return inningsRepository.save(innings);
        }

        // =========================================================
        // APPLY REQUEST
        // =========================================================

        private void applyRequest(
                        Score score,
                        ScoreRequest request) {

                if (request.getStriker() != null) {
                        score.setStriker(
                                        request.getStriker());
                }

                if (request.getNonStriker() != null) {
                        score.setNonStriker(
                                        request.getNonStriker());
                }

                if (request.getBowler() != null) {
                        score.setBowler(
                                        request.getBowler());
                }
        }

        // =========================================================
        // SAFE INTEGER
        // =========================================================

        private String cleanName(String value) {
                return value == null || value.isBlank() ? null : value.trim();
        }

        private boolean isExtraBall(String ballType) {
                String type = ballType == null ? "" : ballType.toUpperCase();
                return type.startsWith("WD") || type.startsWith("NB")
                                || type.startsWith("WIDE") || type.startsWith("NO_BALL");
        }

        private int safeInt(Integer value) {
                return value == null ? 0 : value;
        }

        // =========================================================
        // SAFE FLOAT
        // =========================================================

        private float safeFloat(Float value) {
                return value == null ? 0.0f : value;
        }

        @Override
        public void deleteScore(Long scoreId) {
                if (scoreId == null)
                        throw new IllegalArgumentException("Score ID is required");
                if (!scoreRepository.existsById(scoreId))
                        throw new IllegalArgumentException("Score not found: " + scoreId);
                scoreRepository.deleteById(scoreId);
        }

}

// package mycric.service.impl;

// import mycric.dto.ScoreRequest;
// import mycric.entity.Innings;
// import mycric.entity.Match;
// import mycric.entity.Score;
// import mycric.entity.Team;
// import mycric.repository.InningsRepository;
// import mycric.repository.MatchRepository;
// import mycric.repository.ScoreRepository;
// import mycric.service.ScoreService;

// import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional;

// import java.util.List;
// import java.util.Optional;

// @Service
// @Transactional
// public class ScoreServiceImpl implements ScoreService {

// private final ScoreRepository scoreRepository;
// private final MatchRepository matchRepository;
// private final InningsRepository inningsRepository;

// public ScoreServiceImpl(
// ScoreRepository scoreRepository,
// MatchRepository matchRepository,
// InningsRepository inningsRepository) {

// this.scoreRepository = scoreRepository;
// this.matchRepository = matchRepository;
// this.inningsRepository = inningsRepository;
// }

// // =========================================================
// // SAVE SCORE
// // =========================================================

// @Override
// public Score saveScore(Score score) {
// return scoreRepository.save(score);
// }

// // =========================================================
// // GET ALL SCORES
// // =========================================================

// @Override
// @Transactional(readOnly = true)
// public List<Score> getAllScores() {
// return scoreRepository.findAll();
// }

// // =========================================================
// // GET SCORE BY MATCH
// // =========================================================

// @Override
// @Transactional(readOnly = true)
// public Optional<Score> getScoreByMatch(Long matchId) {

// if (matchId == null) {
// throw new IllegalArgumentException(
// "Match ID is required");
// }

// return scoreRepository.findByMatchId(matchId);
// }

// // =========================================================
// // CREATE SCORE
// // =========================================================

// @Override
// public Score createScore(
// Long matchId,
// ScoreRequest request) {

// if (matchId == null) {
// throw new IllegalArgumentException(
// "Match ID is required");
// }

// if (request == null) {
// throw new IllegalArgumentException(
// "Score request cannot be null");
// }

// Match match = matchRepository.findById(matchId)
// .orElseThrow(() -> new IllegalArgumentException(
// "Match not found: " + matchId));

// /*
// * Make sure innings 1 exists.
// */
// getOrCreateInnings(match, 1);

// Score score = scoreRepository
// .findByMatchId(matchId)
// .orElseGet(() -> {

// Score created = new Score();
// created.setMatch(match);

// /*
// * Depending on your Score entity,
// * these values may already have defaults.
// */
// created.setRuns(0);
// created.setWickets(0);
// created.setOvers(0);

// return created;
// });

// applyRequest(score, request);

// return scoreRepository.save(score);
// }

// // =========================================================
// // UPDATE SCORE
// // =========================================================

// @Override
// public Score updateScore(
// Long scoreId,
// ScoreRequest request) {

// if (scoreId == null) {
// throw new IllegalArgumentException(
// "Score ID is required");
// }

// if (request == null) {
// throw new IllegalArgumentException(
// "Score request cannot be null");
// }

// Score score = scoreRepository
// .findById(scoreId)
// .orElseThrow(() -> new IllegalArgumentException(
// "Score not found: " + scoreId));

// applyRequest(score, request);

// return scoreRepository.save(score);
// }

// // =========================================================
// // RECORD BALL
// // =========================================================

// @Override
// public Score recordBall(ScoreRequest request) {

// if (request == null) {
// throw new IllegalArgumentException(
// "Score request cannot be null");
// }

// if (request.getMatchId() == null) {
// throw new IllegalArgumentException(
// "Match ID is required");
// }

// Long matchId = request.getMatchId();

// Match match = matchRepository.findById(matchId)
// .orElseThrow(() -> new IllegalArgumentException(
// "Match not found: " + matchId));

// /*
// * =====================================================
// * FIND CURRENT INNINGS
// * =====================================================
// */

// Innings innings = inningsRepository
// .findTopByMatch_IdOrderByInningsNumberDesc(matchId)
// .orElseGet(() -> getOrCreateInnings(match, 1));

// /*
// * =====================================================
// * CURRENT SCORE
// * =====================================================
// */

// Score score = scoreRepository
// .findByMatchId(matchId)
// .orElseGet(() -> {

// Score created = new Score();

// created.setMatch(match);
// created.setRuns(0);
// created.setWickets(0);
// created.setOvers(0);

// return created;
// });

// /*
// * =====================================================
// * RUNS
// * =====================================================
// */

// int runs = request.getRuns();

// int newRuns = safeInt(score.getRuns()) + runs;

// score.setRuns(newRuns);

// /*
// * =====================================================
// * WICKET
// * =====================================================
// */

// if (request.isWicket()) {

// score.setWickets(
// safeInt(score.getWickets()) + 1);

// innings.setWickets(
// safeInt(innings.getWickets()) + 1);
// }

// /*
// * =====================================================
// * UPDATE INNINGS RUNS
// * =====================================================
// */

// innings.setRuns(
// safeInt(innings.getRuns()) + runs);

// /*
// * =====================================================
// * LEGAL BALL
// * =====================================================
// *
// * Wide and no-ball are NOT legal balls.
// */

// boolean legalBall;

// if (request.getLegalBall() != null) {
// legalBall = request.getLegalBall();
// } else {
// String ballType = request.getBallType() == null
// ? ""
// : request.getBallType().toUpperCase();

// legalBall = !ballType.startsWith("WD")
// && !ballType.startsWith("NB")
// && !ballType.startsWith("WIDE")
// && !ballType.startsWith("NO_BALL");
// }

// if (legalBall) {

// int balls = safeInt(innings.getBalls()) + 1;

// /*
// * =================================================
// * OVER COMPLETED
// * =================================================
// */

// if (balls >= 6) {

// int completedOvers = safeInt(innings.getOvers()) + 1;

// innings.setOvers(completedOvers);

// innings.setBalls(0);

// } else {

// innings.setBalls(balls);
// }
// }

// /*
// * =====================================================
// * STATUS
// * =====================================================
// */

// innings.setStatus("LIVE");

// /*
// * =====================================================
// * SCORE OVERS
// * =====================================================
// *
// * Keep Score entity compatible with existing frontend.
// */

// float scoreOvers = innings.getOvers()
// + (innings.getBalls() / 10.0f);

// score.setOvers(scoreOvers);

// /*
// * =====================================================
// * SAVE BOTH
// * =====================================================
// */

// inningsRepository.save(innings);

// return scoreRepository.save(score);
// }

// // =========================================================
// // RECORD WICKET
// // =========================================================

// @Override
// public Score recordWicket(
// ScoreRequest request) {

// request.setWicket(true);

// return recordBall(request);
// }

// // =========================================================
// // RECORD WIDE
// // =========================================================

// @Override
// public Score recordWide(
// ScoreRequest request) {

// request.setBallType("WIDE");

// return recordBall(request);
// }

// // =========================================================
// // RECORD NO BALL
// // =========================================================

// @Override
// public Score recordNoBall(
// ScoreRequest request) {

// request.setBallType("NO_BALL");

// return recordBall(request);
// }

// // =========================================================
// // WIDE + WICKET
// // =========================================================

// @Override
// public Score recordWideWicket(
// ScoreRequest request) {

// request.setBallType("WIDE");
// request.setWicket(true);

// return recordBall(request);
// }

// // =========================================================
// // NO BALL + WICKET
// // =========================================================

// @Override
// public Score recordNoBallWicket(
// ScoreRequest request) {

// request.setBallType("NO_BALL");
// request.setWicket(true);

// return recordBall(request);
// }

// // =========================================================
// // UNDO
// // =========================================================

// @Override
// public Score undoLastBall(Long matchId) {

// if (matchId == null) {
// throw new IllegalArgumentException(
// "Match ID is required");
// }

// return getScoreByMatch(matchId)
// .orElseThrow(() -> new IllegalArgumentException(
// "Score not found for match: "
// + matchId));
// }

// // =========================================================
// // RESET SCORE
// // =========================================================

// @Override
// public Score resetScore(Long scoreId) {

// if (scoreId == null) {
// throw new IllegalArgumentException(
// "Score ID is required");
// }

// Score score = scoreRepository
// .findById(scoreId)
// .orElseThrow(() -> new IllegalArgumentException(
// "Score not found: " + scoreId));

// score.setRuns(0);
// score.setWickets(0);
// score.setOvers(0);

// /*
// * Reset corresponding innings as well.
// */

// if (score.getMatch() != null &&
// score.getMatch().getId() != null) {

// inningsRepository
// .findTopByMatch_IdOrderByInningsNumberDesc(
// score.getMatch().getId())
// .ifPresent(innings -> {

// innings.setRuns(0);
// innings.setWickets(0);
// innings.setOvers(0);
// innings.setBalls(0);
// innings.setStatus("LIVE");

// inningsRepository.save(innings);
// });
// }

// return scoreRepository.save(score);
// }

// @Override
// public Score resetForNewInnings(Long matchId) {
// if (matchId == null) {
// throw new IllegalArgumentException("Match ID is required");
// }

// Score score = scoreRepository.findByMatchId(matchId)
// .orElseGet(() -> {
// Match match = matchRepository.findById(matchId)
// .orElseThrow(() -> new IllegalArgumentException(
// "Match not found: " + matchId));

// Score created = new Score();
// created.setMatch(match);
// return created;
// });

// score.setRuns(0);
// score.setWickets(0);
// score.setOvers(0);
// score.setStriker(null);
// score.setNonStriker(null);
// score.setBowler(null);

// return scoreRepository.save(score);
// }

// // =========================================================
// // GET OR CREATE INNINGS
// // =========================================================

// private Innings getOrCreateInnings(
// Match match,
// int inningsNumber) {

// Long matchId = match.getId();

// Optional<Innings> existing = inningsRepository
// .findByMatch_IdAndInningsNumber(
// matchId,
// inningsNumber);

// if (existing.isPresent()) {
// return existing.get();
// }

// Innings innings = new Innings();

// innings.setMatch(match);
// innings.setInningsNumber(inningsNumber);

// /*
// * =====================================================
// * TEAM ASSIGNMENT
// * =====================================================
// */

// if (inningsNumber == 1) {

// innings.setBattingTeam(
// match.getTeamA());

// innings.setBowlingTeam(
// match.getTeamB());

// } else {

// innings.setBattingTeam(
// match.getTeamB());

// innings.setBowlingTeam(
// match.getTeamA());
// }

// /*
// * =====================================================
// * DEFAULT VALUES
// * =====================================================
// */

// innings.setRuns(0);
// innings.setWickets(0);
// innings.setOvers(0);
// innings.setBalls(0);
// innings.setTarget(null);
// innings.setStatus("LIVE");

// return inningsRepository.save(innings);
// }

// // =========================================================
// // APPLY REQUEST
// // =========================================================

// private void applyRequest(
// Score score,
// ScoreRequest request) {

// if (request.getStriker() != null) {
// score.setStriker(
// request.getStriker());
// }

// if (request.getNonStriker() != null) {
// score.setNonStriker(
// request.getNonStriker());
// }

// if (request.getBowler() != null) {
// score.setBowler(
// request.getBowler());
// }
// }

// // =========================================================
// // SAFE INTEGER
// // =========================================================

// private int safeInt(Integer value) {
// return value == null ? 0 : value;
// }

// // =========================================================
// // SAFE FLOAT
// // =========================================================

// private float safeFloat(Float value) {
// return value == null ? 0.0f : value;
// }

// @Override
// public void deleteScore(Long scoreId) {
// if (scoreId == null) throw new IllegalArgumentException("Score ID is
// required");
// if (!scoreRepository.existsById(scoreId)) throw new
// IllegalArgumentException("Score not found: " + scoreId);
// scoreRepository.deleteById(scoreId);
// }

// }