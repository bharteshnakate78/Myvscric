
package mycric.service.impl;

import mycric.dto.MatchRequest;
import mycric.entity.Innings;
import mycric.entity.MatchBallRecord;
import mycric.entity.Player;
import mycric.entity.Match;
import mycric.entity.Team;
import mycric.entity.Tournament;

import mycric.repository.InningsRepository;
import mycric.repository.MatchBallRecordRepository;
import mycric.repository.PlayerRepository;
import mycric.repository.MatchRepository;
import mycric.repository.ScoreRepository;
import mycric.repository.TeamRepository;
import mycric.repository.TournamentRepository;

import mycric.service.MatchService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MatchServiceImpl implements MatchService {

        @Autowired
        private MatchRepository matchRepository;

        @Autowired
        private TeamRepository teamRepository;

        @Autowired
        private TournamentRepository tournamentRepository;

        @Autowired
        private InningsRepository inningsRepository;

        @Autowired
        private ScoreRepository scoreRepository;

        @Autowired
        private MatchBallRecordRepository ballRecordRepository;

        @Autowired
        private PlayerRepository playerRepository;

        // =========================================================
        // SAVE MATCH
        // =========================================================

        @Override
        public Match saveMatch(Match match) {

                if (match == null) {
                        throw new IllegalArgumentException(
                                        "Match data cannot be null");
                }

                return matchRepository.save(match);
        }

        // =========================================================
        // CREATE MATCH FROM REQUEST
        // =========================================================

        @Override
        public Match saveMatch(MatchRequest request) {

                if (request == null) {
                        throw new IllegalArgumentException(
                                        "Match request cannot be null");
                }

                Match match = toMatch(request);

                return matchRepository.save(match);
        }

        // =========================================================
        // CONVERT REQUEST -> MATCH
        // =========================================================

        private Match toMatch(MatchRequest request) {

                if (request.getTournamentId() == null ||
                                request.getTeamAId() == null ||
                                request.getTeamBId() == null) {

                        throw new IllegalArgumentException(
                                        "Tournament, Team A and Team B are required");
                }

                if (request.getTeamAId().equals(
                                request.getTeamBId())) {

                        throw new IllegalArgumentException(
                                        "Team A and Team B must be different");
                }

                Tournament tournament = tournamentRepository
                                .findById(request.getTournamentId())
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Tournament not found: "
                                                                + request.getTournamentId()));

                Team teamA = teamRepository
                                .findById(request.getTeamAId())
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Team A not found: "
                                                                + request.getTeamAId()));

                Team teamB = teamRepository
                                .findById(request.getTeamBId())
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Team B not found: "
                                                                + request.getTeamBId()));

                Match match = new Match();

                match.setName(request.getName());

                match.setTournament(tournament);

                match.setTeamA(teamA);

                match.setTeamB(teamB);

                match.setMatchDate(request.getMatchDate());
                match.setTime(request.getTime());

                match.setVenue(
                                request.getVenue());

                match.setMatchType(
                                request.getMatchType());

                match.setOvers(
                                request.getOvers());

                match.setStatus(request.getStatus() == null || request.getStatus().isBlank()
                                ? "SCHEDULED"
                                : request.getStatus().toUpperCase());
                match.setTeam1Score(request.getTeam1Score());
                match.setTeam2Score(request.getTeam2Score());
                match.setResult(request.getResult());
                match.setToss(request.getToss());

                return match;
        }

        // =========================================================
        // GET ALL MATCHES
        // =========================================================

        @Override
        @Transactional(readOnly = true)
        public List<Match> getAllMatches() {

                return matchRepository.findAll();
        }

        // =========================================================
        // GET MATCH BY ID
        // =========================================================

        @Override
        @Transactional(readOnly = true)
        public Match getMatchById(Long id) {

                return matchRepository
                                .findById(id)
                                .orElse(null);
        }

        // =========================================================
        // GET MATCHES BY STATUS
        // =========================================================

        @Override
        @Transactional(readOnly = true)
        public List<Match> getMatchesByStatus(
                        String status) {

                return matchRepository.findByStatusIgnoreCase(status);
        }

        // =========================================================
        // GET MATCHES BY TOURNAMENT
        // =========================================================

        @Override
        @Transactional(readOnly = true)
        public List<Match> getMatchesByTournament(
                        Long tournamentId) {

                return matchRepository
                                .findByTournamentId(tournamentId);
        }

        // =========================================================
        // UPDATE MATCH
        // =========================================================

        @Override
        public Match updateMatch(
                        Long id,
                        Match match) {

                Match existingMatch = matchRepository
                                .findById(id)
                                .orElse(null);

                if (existingMatch == null) {
                        return null;
                }

                existingMatch.setName(
                                match.getName());

                existingMatch.setTeamA(
                                match.getTeamA());

                existingMatch.setTeamB(
                                match.getTeamB());

                existingMatch.setVenue(
                                match.getVenue());

                existingMatch.setMatchDate(
                                match.getMatchDate());

                existingMatch.setStatus(
                                match.getStatus());

                existingMatch.setWinner(
                                match.getWinner());

                return matchRepository.save(
                                existingMatch);
        }

        // =========================================================
        // UPDATE MATCH FROM REQUEST
        // =========================================================

        @Override
        public Match updateMatch(
                        Long id,
                        MatchRequest request) {

                Match existing = matchRepository
                                .findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Match not found: " + id));

                boolean completingNow = !"COMPLETED".equalsIgnoreCase(existing.getStatus())
                                && "COMPLETED".equalsIgnoreCase(request.getStatus());

                Match updated = toMatch(request);

                existing.setName(
                                updated.getName());

                existing.setTournament(
                                updated.getTournament());

                existing.setTeamA(
                                updated.getTeamA());

                existing.setTeamB(
                                updated.getTeamB());

                existing.setMatchDate(updated.getMatchDate());
                existing.setTime(updated.getTime());

                existing.setVenue(
                                updated.getVenue());

                existing.setMatchType(
                                updated.getMatchType());

                existing.setOvers(updated.getOvers());
                existing.setStatus(updated.getStatus());
                existing.setTeam1Score(updated.getTeam1Score());
                existing.setTeam2Score(updated.getTeam2Score());
                existing.setResult(updated.getResult());
                existing.setToss(updated.getToss());

                Match saved = matchRepository.save(existing);
                if (completingNow) {
                        updateRegisteredPlayerStats(saved.getId());
                }
                return saved;
        }

        /**
         * Update career statistics once, when a match first changes to COMPLETED.
         * Super Over innings (innings 3+) are excluded from standard career runs
         * and wickets. A player is counted as having played if they batted or bowled
         * at least one recorded delivery in the first two innings.
         */
        private void updateRegisteredPlayerStats(Long matchId) {
                List<MatchBallRecord> deliveries = ballRecordRepository.findByMatchId(matchId);
                java.util.Map<Long, PlayerMatchDelta> deltas = new java.util.LinkedHashMap<>();

                for (MatchBallRecord delivery : deliveries) {
                        if (delivery.getInningsNumber() == null || delivery.getInningsNumber() > 2) {
                                continue;
                        }

                        Player batter = findRegisteredPlayer(delivery.getStrikerName(), delivery.getBattingTeamId());
                        if (batter != null) {
                                PlayerMatchDelta delta = deltas.computeIfAbsent(
                                                batter.getId(), ignored -> new PlayerMatchDelta(batter));
                                delta.appeared = true;
                                delta.runs += delivery.getBatsmanRuns();
                        }

                        Player nonStriker = findRegisteredPlayer(delivery.getNonStrikerName(),
                                        delivery.getBattingTeamId());
                        if (nonStriker != null) {
                                PlayerMatchDelta delta = deltas.computeIfAbsent(
                                                nonStriker.getId(), ignored -> new PlayerMatchDelta(nonStriker));
                                delta.appeared = true;
                        }

                        Player bowler = findRegisteredPlayer(delivery.getBowlerName(), delivery.getBowlingTeamId());
                        if (bowler != null) {
                                PlayerMatchDelta delta = deltas.computeIfAbsent(
                                                bowler.getId(), ignored -> new PlayerMatchDelta(bowler));
                                delta.appeared = true;
                                if (delivery.isWicket() && isBowlerCreditedWicket(delivery.getWicketType())) {
                                        delta.wickets++;
                                }
                        }
                }

                for (PlayerMatchDelta delta : deltas.values()) {
                        if (!delta.appeared) {
                                continue;
                        }
                        Player player = delta.player;
                        player.setMatches(player.getMatches() + 1);
                        player.setRuns(player.getRuns() + delta.runs);
                        player.setWickets(player.getWickets() + delta.wickets);
                        playerRepository.save(player);
                }
        }

        private Player findRegisteredPlayer(String name, Long teamId) {
                if (name == null || name.isBlank() || teamId == null) {
                        return null;
                }
                return playerRepository.findByPlayerNameIgnoreCaseAndTeam_Id(name.trim(), teamId)
                                .stream().findFirst().orElse(null);
        }

        private boolean isBowlerCreditedWicket(String wicketType) {
                if (wicketType == null || wicketType.isBlank()) {
                        return true;
                }
                String type = wicketType.toUpperCase().replace('_', ' ').replace('-', ' ');
                return !type.contains("RUN OUT")
                                && !type.contains("RETIRED HURT")
                                && !type.contains("OBSTRUCTING THE FIELD");
        }

        private static class PlayerMatchDelta {
                private final Player player;
                private int runs;
                private int wickets;
                private boolean appeared;

                private PlayerMatchDelta(Player player) {
                        this.player = player;
                }
        }

        // // =========================================================
        // // START MATCH
        // // =========================================================

        // @Override
        // public Match startMatch(Long matchId) {

        // if (matchId == null) {
        // throw new IllegalArgumentException(
        // "Match ID is required");
        // }

        // // -----------------------------------------------------
        // // Find match
        // // -----------------------------------------------------

        // Match match = matchRepository
        // .findById(matchId)
        // .orElseThrow(() -> new IllegalArgumentException(
        // "Match not found: "
        // + matchId));

        // // -----------------------------------------------------
        // // Check whether innings 1 already exists
        // // -----------------------------------------------------

        // Innings innings1 = inningsRepository
        // .findByMatch_IdAndInningsNumber(
        // matchId,
        // 1)
        // .orElse(null);

        // // -----------------------------------------------------
        // // Create innings 1 if it doesn't exist
        // // -----------------------------------------------------

        // if (innings1 == null) {

        // innings1 = new Innings();

        // innings1.setMatch(match);

        // innings1.setInningsNumber(1);

        // // Team A bats first
        // innings1.setBattingTeam(
        // match.getTeamA());

        // // Team B bowls first
        // innings1.setBowlingTeam(
        // match.getTeamB());

        // innings1.setRuns(0);

        // innings1.setWickets(0);

        // innings1.setOvers(0);

        // innings1.setBalls(0);

        // innings1.setTarget(null);

        // innings1.setStatus("LIVE");

        // inningsRepository.save(innings1);
        // }

        // // -----------------------------------------------------
        // // Change match status
        // // -----------------------------------------------------

        // match.setStatus("LIVE");

        // return matchRepository.save(match);
        // }
        // =========================================================
        // START MATCH
        // =========================================================

        @Override
        @Transactional
        public Match startMatch(Long matchId) {

                if (matchId == null) {
                        throw new IllegalArgumentException(
                                        "Match ID is required");
                }

                // ---------------------------------------------------------
                // FIND MATCH
                // ---------------------------------------------------------

                Match match = matchRepository
                                .findById(matchId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Match not found: " + matchId));

                // ---------------------------------------------------------
                // VALIDATE TEAMS
                // ---------------------------------------------------------

                if (match.getTeamA() == null ||
                                match.getTeamB() == null) {

                        throw new IllegalStateException(
                                        "Match must have Team A and Team B before it can start");
                }

                if (match.getTeamA().getId() == null ||
                                match.getTeamB().getId() == null) {

                        throw new IllegalStateException(
                                        "Match teams must have valid IDs");
                }

                if (match.getTeamA().getId()
                                .equals(match.getTeamB().getId())) {

                        throw new IllegalStateException(
                                        "Team A and Team B must be different");
                }

                // ---------------------------------------------------------
                // FIND FIRST INNINGS
                // ---------------------------------------------------------

                Innings innings1 = inningsRepository
                                .findByMatch_IdAndInningsNumber(
                                                matchId,
                                                1)
                                .orElse(null);

                // ---------------------------------------------------------
                // CREATE FIRST INNINGS
                // ---------------------------------------------------------

                if (innings1 == null) {

                        innings1 = new Innings();

                        innings1.setMatch(match);

                        innings1.setInningsNumber(1);

                        /*
                         * Team A bats first.
                         */
                        innings1.setBattingTeam(
                                        match.getTeamA());

                        /*
                         * Team B bowls first.
                         */
                        innings1.setBowlingTeam(
                                        match.getTeamB());

                        innings1.setRuns(0);

                        innings1.setWickets(0);

                        innings1.setOvers(0);

                        innings1.setBalls(0);

                        /*
                         * IMPORTANT:
                         *
                         * Previously this was NULL.
                         *
                         * But Innings.target is nullable=false.
                         *
                         * Therefore first innings uses target = 0.
                         */
                        innings1.setTarget(0);

                        innings1.setStatus("LIVE");

                        inningsRepository.saveAndFlush(innings1);

                } else {

                        /*
                         * Repair an old innings row if target
                         * somehow contains NULL.
                         */
                        if (innings1.getTarget() == null) {
                                innings1.setTarget(0);
                        }

                        innings1.setStatus("LIVE");

                        inningsRepository.saveAndFlush(innings1);
                }

                // ---------------------------------------------------------
                // CREATE INITIAL SCORE
                // ---------------------------------------------------------

                /*
                 * Create a scoreboard row immediately.
                 *
                 * This prevents:
                 *
                 * GET /api/scores/match/{id}
                 *
                 * from returning 404 after the match has started.
                 */

                if (scoreRepository
                                .findByMatchId(matchId)
                                .isEmpty()) {

                        mycric.entity.Score score = new mycric.entity.Score();

                        score.setMatch(match);

                        score.setRuns(0);

                        score.setWickets(0);

                        score.setOvers(0);

                        scoreRepository.saveAndFlush(score);
                }

                // ---------------------------------------------------------
                // UPDATE MATCH STATUS
                // ---------------------------------------------------------

                match.setStatus("LIVE");

                return matchRepository.save(match);
        }

        // =========================================================
        // DELETE MATCH
        // =========================================================

        @Override
        @Transactional
        public void deleteMatch(Long id) {

                if (id == null) {
                        throw new IllegalArgumentException(
                                        "Match ID is required");
                }

                Match match = matchRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Match not found: " + id));

                // Remove scoreboard records before the match to satisfy foreign keys.
                inningsRepository
                                .findByMatch_IdOrderByInningsNumberAsc(id)
                                .forEach(inningsRepository::delete);

                scoreRepository.findByMatchId(id)
                                .ifPresent(scoreRepository::delete);

                matchRepository.delete(match);
        }
}

// package mycric.service.impl;

// import mycric.dto.MatchRequest;
// import mycric.entity.Innings;
// import mycric.entity.Match;
// import mycric.entity.Team;
// import mycric.entity.Tournament;

// import mycric.repository.InningsRepository;
// import mycric.repository.MatchRepository;
// import mycric.repository.ScoreRepository;
// import mycric.repository.TeamRepository;
// import mycric.repository.TournamentRepository;

// import mycric.service.MatchService;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional;

// import java.util.List;

// @Service
// @Transactional
// public class MatchServiceImpl implements MatchService {

// @Autowired
// private MatchRepository matchRepository;

// @Autowired
// private TeamRepository teamRepository;

// @Autowired
// private TournamentRepository tournamentRepository;

// @Autowired
// private InningsRepository inningsRepository;

// @Autowired
// private ScoreRepository scoreRepository;

// // =========================================================
// // SAVE MATCH
// // =========================================================

// @Override
// public Match saveMatch(Match match) {

// if (match == null) {
// throw new IllegalArgumentException(
// "Match data cannot be null");
// }

// return matchRepository.save(match);
// }

// // =========================================================
// // CREATE MATCH FROM REQUEST
// // =========================================================

// @Override
// public Match saveMatch(MatchRequest request) {

// if (request == null) {
// throw new IllegalArgumentException(
// "Match request cannot be null");
// }

// Match match = toMatch(request);

// return matchRepository.save(match);
// }

// // =========================================================
// // CONVERT REQUEST -> MATCH
// // =========================================================

// private Match toMatch(MatchRequest request) {

// if (request.getTournamentId() == null ||
// request.getTeamAId() == null ||
// request.getTeamBId() == null) {

// throw new IllegalArgumentException(
// "Tournament, Team A and Team B are required");
// }

// if (request.getTeamAId().equals(
// request.getTeamBId())) {

// throw new IllegalArgumentException(
// "Team A and Team B must be different");
// }

// Tournament tournament = tournamentRepository
// .findById(request.getTournamentId())
// .orElseThrow(() -> new IllegalArgumentException(
// "Tournament not found: "
// + request.getTournamentId()));

// Team teamA = teamRepository
// .findById(request.getTeamAId())
// .orElseThrow(() -> new IllegalArgumentException(
// "Team A not found: "
// + request.getTeamAId()));

// Team teamB = teamRepository
// .findById(request.getTeamBId())
// .orElseThrow(() -> new IllegalArgumentException(
// "Team B not found: "
// + request.getTeamBId()));

// Match match = new Match();

// match.setName(request.getName());

// match.setTournament(tournament);

// match.setTeamA(teamA);

// match.setTeamB(teamB);

// match.setMatchDate(request.getMatchDate());
// match.setTime(request.getTime());

// match.setVenue(
// request.getVenue());

// match.setMatchType(
// request.getMatchType());

// match.setOvers(
// request.getOvers());

// match.setStatus(request.getStatus() == null || request.getStatus().isBlank()
// ? "SCHEDULED"
// : request.getStatus().toUpperCase());
// match.setTeam1Score(request.getTeam1Score());
// match.setTeam2Score(request.getTeam2Score());
// match.setResult(request.getResult());
// match.setToss(request.getToss());

// return match;
// }

// // =========================================================
// // GET ALL MATCHES
// // =========================================================

// @Override
// @Transactional(readOnly = true)
// public List<Match> getAllMatches() {

// return matchRepository.findAll();
// }

// // =========================================================
// // GET MATCH BY ID
// // =========================================================

// @Override
// @Transactional(readOnly = true)
// public Match getMatchById(Long id) {

// return matchRepository
// .findById(id)
// .orElse(null);
// }

// // =========================================================
// // GET MATCHES BY STATUS
// // =========================================================

// @Override
// @Transactional(readOnly = true)
// public List<Match> getMatchesByStatus(
// String status) {

// return matchRepository.findByStatusIgnoreCase(status);
// }

// // =========================================================
// // GET MATCHES BY TOURNAMENT
// // =========================================================

// @Override
// @Transactional(readOnly = true)
// public List<Match> getMatchesByTournament(
// Long tournamentId) {

// return matchRepository
// .findByTournamentId(tournamentId);
// }

// // =========================================================
// // UPDATE MATCH
// // =========================================================

// @Override
// public Match updateMatch(
// Long id,
// Match match) {

// Match existingMatch = matchRepository
// .findById(id)
// .orElse(null);

// if (existingMatch == null) {
// return null;
// }

// existingMatch.setName(
// match.getName());

// existingMatch.setTeamA(
// match.getTeamA());

// existingMatch.setTeamB(
// match.getTeamB());

// existingMatch.setVenue(
// match.getVenue());

// existingMatch.setMatchDate(
// match.getMatchDate());

// existingMatch.setStatus(
// match.getStatus());

// existingMatch.setWinner(
// match.getWinner());

// return matchRepository.save(
// existingMatch);
// }

// // =========================================================
// // UPDATE MATCH FROM REQUEST
// // =========================================================

// @Override
// public Match updateMatch(
// Long id,
// MatchRequest request) {

// Match existing = matchRepository
// .findById(id)
// .orElseThrow(() -> new IllegalArgumentException(
// "Match not found: " + id));

// Match updated = toMatch(request);

// existing.setName(
// updated.getName());

// existing.setTournament(
// updated.getTournament());

// existing.setTeamA(
// updated.getTeamA());

// existing.setTeamB(
// updated.getTeamB());

// existing.setMatchDate(updated.getMatchDate());
// existing.setTime(updated.getTime());

// existing.setVenue(
// updated.getVenue());

// existing.setMatchType(
// updated.getMatchType());

// existing.setOvers(updated.getOvers());
// existing.setStatus(updated.getStatus());
// existing.setTeam1Score(updated.getTeam1Score());
// existing.setTeam2Score(updated.getTeam2Score());
// existing.setResult(updated.getResult());
// existing.setToss(updated.getToss());

// return matchRepository.save(existing);
// }

// // // =========================================================
// // // START MATCH
// // // =========================================================

// // @Override
// // public Match startMatch(Long matchId) {

// // if (matchId == null) {
// // throw new IllegalArgumentException(
// // "Match ID is required");
// // }

// // // -----------------------------------------------------
// // // Find match
// // // -----------------------------------------------------

// // Match match = matchRepository
// // .findById(matchId)
// // .orElseThrow(() -> new IllegalArgumentException(
// // "Match not found: "
// // + matchId));

// // // -----------------------------------------------------
// // // Check whether innings 1 already exists
// // // -----------------------------------------------------

// // Innings innings1 = inningsRepository
// // .findByMatch_IdAndInningsNumber(
// // matchId,
// // 1)
// // .orElse(null);

// // // -----------------------------------------------------
// // // Create innings 1 if it doesn't exist
// // // -----------------------------------------------------

// // if (innings1 == null) {

// // innings1 = new Innings();

// // innings1.setMatch(match);

// // innings1.setInningsNumber(1);

// // // Team A bats first
// // innings1.setBattingTeam(
// // match.getTeamA());

// // // Team B bowls first
// // innings1.setBowlingTeam(
// // match.getTeamB());

// // innings1.setRuns(0);

// // innings1.setWickets(0);

// // innings1.setOvers(0);

// // innings1.setBalls(0);

// // innings1.setTarget(null);

// // innings1.setStatus("LIVE");

// // inningsRepository.save(innings1);
// // }

// // // -----------------------------------------------------
// // // Change match status
// // // -----------------------------------------------------

// // match.setStatus("LIVE");

// // return matchRepository.save(match);
// // }
// // =========================================================
// // START MATCH
// // =========================================================

// @Override
// @Transactional
// public Match startMatch(Long matchId) {

// if (matchId == null) {
// throw new IllegalArgumentException(
// "Match ID is required");
// }

// // ---------------------------------------------------------
// // FIND MATCH
// // ---------------------------------------------------------

// Match match = matchRepository
// .findById(matchId)
// .orElseThrow(() -> new IllegalArgumentException(
// "Match not found: " + matchId));

// // ---------------------------------------------------------
// // VALIDATE TEAMS
// // ---------------------------------------------------------

// if (match.getTeamA() == null ||
// match.getTeamB() == null) {

// throw new IllegalStateException(
// "Match must have Team A and Team B before it can start");
// }

// if (match.getTeamA().getId() == null ||
// match.getTeamB().getId() == null) {

// throw new IllegalStateException(
// "Match teams must have valid IDs");
// }

// if (match.getTeamA().getId()
// .equals(match.getTeamB().getId())) {

// throw new IllegalStateException(
// "Team A and Team B must be different");
// }

// // ---------------------------------------------------------
// // FIND FIRST INNINGS
// // ---------------------------------------------------------

// Innings innings1 = inningsRepository
// .findByMatch_IdAndInningsNumber(
// matchId,
// 1)
// .orElse(null);

// // ---------------------------------------------------------
// // CREATE FIRST INNINGS
// // ---------------------------------------------------------

// if (innings1 == null) {

// innings1 = new Innings();

// innings1.setMatch(match);

// innings1.setInningsNumber(1);

// /*
// * Team A bats first.
// */
// innings1.setBattingTeam(
// match.getTeamA());

// /*
// * Team B bowls first.
// */
// innings1.setBowlingTeam(
// match.getTeamB());

// innings1.setRuns(0);

// innings1.setWickets(0);

// innings1.setOvers(0);

// innings1.setBalls(0);

// /*
// * IMPORTANT:
// *
// * Previously this was NULL.
// *
// * But Innings.target is nullable=false.
// *
// * Therefore first innings uses target = 0.
// */
// innings1.setTarget(0);

// innings1.setStatus("LIVE");

// inningsRepository.saveAndFlush(innings1);

// } else {

// /*
// * Repair an old innings row if target
// * somehow contains NULL.
// */
// if (innings1.getTarget() == null) {
// innings1.setTarget(0);
// }

// innings1.setStatus("LIVE");

// inningsRepository.saveAndFlush(innings1);
// }

// // ---------------------------------------------------------
// // CREATE INITIAL SCORE
// // ---------------------------------------------------------

// /*
// * Create a scoreboard row immediately.
// *
// * This prevents:
// *
// * GET /api/scores/match/{id}
// *
// * from returning 404 after the match has started.
// */

// if (scoreRepository
// .findByMatchId(matchId)
// .isEmpty()) {

// mycric.entity.Score score = new mycric.entity.Score();

// score.setMatch(match);

// score.setRuns(0);

// score.setWickets(0);

// score.setOvers(0);

// scoreRepository.saveAndFlush(score);
// }

// // ---------------------------------------------------------
// // UPDATE MATCH STATUS
// // ---------------------------------------------------------

// match.setStatus("LIVE");

// return matchRepository.save(match);
// }

// // =========================================================
// // DELETE MATCH
// // =========================================================

// @Override
// @Transactional
// public void deleteMatch(Long id) {

// if (id == null) {
// throw new IllegalArgumentException(
// "Match ID is required");
// }

// Match match = matchRepository.findById(id)
// .orElseThrow(() -> new IllegalArgumentException(
// "Match not found: " + id));

// // Remove scoreboard records before the match to satisfy foreign keys.
// inningsRepository
// .findByMatch_IdOrderByInningsNumberAsc(id)
// .forEach(inningsRepository::delete);

// scoreRepository.findByMatchId(id)
// .ifPresent(scoreRepository::delete);

// matchRepository.delete(match);
// }
// }
