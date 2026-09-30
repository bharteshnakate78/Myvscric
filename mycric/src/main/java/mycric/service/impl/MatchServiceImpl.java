package mycric.service.impl;

import mycric.dto.MatchRequest;
import mycric.entity.Innings;
import mycric.entity.Match;
import mycric.entity.Team;
import mycric.entity.Tournament;

import mycric.repository.InningsRepository;
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

                match.setStatus(request.getStatus() == null || request.getStatus().isBlank() ? "SCHEDULED" : request.getStatus().toUpperCase());
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

                return matchRepository.save(existing);
        }

        // =========================================================
        // START MATCH
        // =========================================================

        @Override
        public Match startMatch(Long matchId) {

                if (matchId == null) {
                        throw new IllegalArgumentException(
                                        "Match ID is required");
                }

                // -----------------------------------------------------
                // Find match
                // -----------------------------------------------------

                Match match = matchRepository
                                .findById(matchId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Match not found: "
                                                                + matchId));

                // -----------------------------------------------------
                // Check whether innings 1 already exists
                // -----------------------------------------------------

                Innings innings1 = inningsRepository
                                .findByMatch_IdAndInningsNumber(
                                                matchId,
                                                1)
                                .orElse(null);

                // -----------------------------------------------------
                // Create innings 1 if it doesn't exist
                // -----------------------------------------------------

                if (innings1 == null) {

                        innings1 = new Innings();

                        innings1.setMatch(match);

                        innings1.setInningsNumber(1);

                        // Team A bats first
                        innings1.setBattingTeam(
                                        match.getTeamA());

                        // Team B bowls first
                        innings1.setBowlingTeam(
                                        match.getTeamB());

                        innings1.setRuns(0);

                        innings1.setWickets(0);

                        innings1.setOvers(0);

                        innings1.setBalls(0);

                        innings1.setTarget(null);

                        innings1.setStatus("LIVE");

                        inningsRepository.save(innings1);
                }

                // -----------------------------------------------------
                // Change match status
                // -----------------------------------------------------

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

// import mycric.entity.Match;
// import mycric.dto.MatchRequest;
// import mycric.entity.Team;
// import mycric.entity.Tournament;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;
// import mycric.repository.MatchRepository;
// import mycric.repository.TeamRepository;
// import mycric.repository.TournamentRepository;
// import mycric.service.MatchService;

// import java.util.List;

// @Service
// public class MatchServiceImpl implements MatchService {

// @Autowired
// private MatchRepository matchRepository;

// @Autowired
// private TeamRepository teamRepository;

// @Autowired
// private TournamentRepository tournamentRepository;

// @Override
// public Match saveMatch(Match match) {
// return matchRepository.save(match);
// }

// @Override
// public Match saveMatch(MatchRequest request) {
// return matchRepository.save(toMatch(request));
// }

// private Match toMatch(MatchRequest request) {
// if (request.getTournamentId() == null || request.getTeamAId() == null ||
// request.getTeamBId() == null) {
// throw new IllegalArgumentException("Tournament, Team A and Team B are
// required");
// }
// if (request.getTeamAId().equals(request.getTeamBId())) {
// throw new IllegalArgumentException("Team A and Team B must be different");
// }
// Tournament tournament =
// tournamentRepository.findById(request.getTournamentId())
// .orElseThrow(() -> new IllegalArgumentException("Tournament not found: " +
// request.getTournamentId()));
// Team teamA = teamRepository.findById(request.getTeamAId())
// .orElseThrow(() -> new IllegalArgumentException("Team A not found: " +
// request.getTeamAId()));
// Team teamB = teamRepository.findById(request.getTeamBId())
// .orElseThrow(() -> new IllegalArgumentException("Team B not found: " +
// request.getTeamBId()));
// Match match = new Match();
// match.setName(request.getName());
// match.setTournament(tournament);
// match.setTeamA(teamA);
// match.setTeamB(teamB);
// match.setMatchDate(request.getMatchDate());
// match.setVenue(request.getVenue());
// match.setMatchType(request.getMatchType());
// match.setOvers(request.getOvers());
// match.setStatus(request.getStatus() == null || request.getStatus().isBlank() ? "SCHEDULED" : request.getStatus().toUpperCase());
                match.setTeam1Score(request.getTeam1Score());
                match.setTeam2Score(request.getTeam2Score());
                match.setResult(request.getResult());
                match.setToss(request.getToss());
// return match;
// }

// @Override
// public List<Match> getAllMatches() {
// return matchRepository.findAll();
// }

// @Override
// public Match getMatchById(Long id) {
// return matchRepository.findById(id).orElse(null);
// }

// @Override
// public List<Match> getMatchesByStatus(String status) {
// return matchRepository.findByStatusIgnoreCase(status);
// }

// @Override
// public List<Match> getMatchesByTournament(Long tournamentId) {
// return matchRepository.findByTournamentId(tournamentId);
// }

// @Override
// public Match updateMatch(Long id, Match match) {

// Match existingMatch = matchRepository.findById(id).orElse(null);

// if (existingMatch != null) {

// existingMatch.setName(match.getName());
// existingMatch.setTeamA(match.getTeamA());
// existingMatch.setTeamB(match.getTeamB());
// existingMatch.setVenue(match.getVenue());
// existingMatch.setMatchDate(match.getMatchDate());
// existingMatch.setStatus(match.getStatus());
// existingMatch.setWinner(match.getWinner());

// return matchRepository.save(existingMatch);
// }

// return null;
// }

// @Override
// public Match updateMatch(Long id, MatchRequest request) {
// Match existing = matchRepository.findById(id)
// .orElseThrow(() -> new IllegalArgumentException("Match not found: " + id));
// Match updated = toMatch(request);
// existing.setName(updated.getName());
// existing.setTournament(updated.getTournament());
// existing.setTeamA(updated.getTeamA());
// existing.setTeamB(updated.getTeamB());
// existing.setMatchDate(updated.getMatchDate());
// existing.setVenue(updated.getVenue());
// existing.setMatchType(updated.getMatchType());
// existing.setOvers(updated.getOvers());
// return matchRepository.save(existing);
// }

// @Override
// public void deleteMatch(Long id) {
// matchRepository.deleteById(id);
// }
// }