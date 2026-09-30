
package mycric.service.impl;

import mycric.dto.TeamRequest;
import mycric.dto.TeamResponse;
import mycric.entity.Team;
import mycric.entity.Tournament;
import mycric.repository.TeamRepository;
import mycric.repository.TournamentRepository;
import mycric.repository.MatchRepository;
import mycric.repository.InningsRepository;
import mycric.repository.ScoreRepository;
import mycric.service.TeamService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TeamServiceImpl implements TeamService {

        private final TeamRepository teamRepository;
        private final TournamentRepository tournamentRepository;
        private final MatchRepository matchRepository;
        private final InningsRepository inningsRepository;
        private final ScoreRepository scoreRepository;

        public TeamServiceImpl(
                        TeamRepository teamRepository,
                        TournamentRepository tournamentRepository,
                        MatchRepository matchRepository,
                        InningsRepository inningsRepository,
                        ScoreRepository scoreRepository) {

                this.teamRepository = teamRepository;
                this.tournamentRepository = tournamentRepository;
                this.matchRepository = matchRepository;
                this.inningsRepository = inningsRepository;
                this.scoreRepository = scoreRepository;
        }

        // =========================================================
        // CREATE TEAM
        // =========================================================

        @Override
        public TeamResponse saveTeam(TeamRequest request) {

                if (request == null) {
                        throw new IllegalArgumentException(
                                        "Team request cannot be null");
                }

                if (request.getTeamName() == null ||
                                request.getTeamName().trim().isEmpty()) {

                        throw new IllegalArgumentException(
                                        "Team name is required");
                }

                if (request.getTournamentId() == null) {

                        throw new IllegalArgumentException(
                                        "Tournament ID is required");
                }

                Tournament tournament = tournamentRepository
                                .findById(request.getTournamentId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Tournament not found with id: "
                                                                + request.getTournamentId()));

                Team team = new Team();

                // Basic team information
                team.setTeamName(
                                request.getTeamName().trim());

                team.setShortName(clean(request.getShortName()));
                team.setCaptain(
                                clean(request.getCaptain()));

                team.setCoach(
                                clean(request.getCoach()));
                team.setCity(clean(request.getCity()));

                // Tournament relationship
                team.setTournament(tournament);

                // Save
                Team savedTeam = teamRepository.save(team);

                return convertToResponse(savedTeam);
        }

        // =========================================================
        // GET ALL TEAMS
        // =========================================================

        @Override
        @Transactional(readOnly = true)
        public List<TeamResponse> getAllTeams() {

                return teamRepository
                                .findAllByOrderByTeamNameAsc()
                                .stream()
                                .map(this::convertToResponse)
                                .toList();
        }

        // =========================================================
        // GET TEAM BY ID
        // =========================================================

        @Override
        @Transactional(readOnly = true)
        public TeamResponse getTeamById(Long id) {

                if (id == null) {
                        throw new IllegalArgumentException(
                                        "Team ID cannot be null");
                }

                Team team = teamRepository
                                .findById(id)
                                .orElseThrow(() -> new RuntimeException(
                                                "Team not found with id: " + id));

                return convertToResponse(team);
        }

        // =========================================================
        // GET TEAMS BY TOURNAMENT
        // =========================================================

        @Override
        @Transactional(readOnly = true)
        public List<TeamResponse> getTeamsByTournament(
                        Long tournamentId) {

                if (tournamentId == null) {
                        throw new IllegalArgumentException(
                                        "Tournament ID cannot be null");
                }

                return teamRepository
                                .findByTournamentId(tournamentId)
                                .stream()
                                .map(this::convertToResponse)
                                .toList();
        }

        // =========================================================
        // UPDATE TEAM
        // =========================================================

        @Override
        public TeamResponse updateTeam(
                        Long id,
                        TeamRequest request) {

                if (id == null) {
                        throw new IllegalArgumentException(
                                        "Team ID cannot be null");
                }

                if (request == null) {
                        throw new IllegalArgumentException(
                                        "Team request cannot be null");
                }

                Team existingTeam = teamRepository
                                .findById(id)
                                .orElseThrow(() -> new RuntimeException(
                                                "Team not found with id: " + id));

                // Team name
                if (request.getTeamName() != null &&
                                !request.getTeamName().trim().isEmpty()) {

                        existingTeam.setTeamName(
                                        request.getTeamName().trim());
                }

                // Captain
                if (request.getCaptain() != null) {

                        existingTeam.setShortName(clean(request.getShortName()));
                        existingTeam.setCaptain(
                                        clean(request.getCaptain()));
                }

                // Coach
                if (request.getCoach() != null) {

                        existingTeam.setCoach(
                                        clean(request.getCoach()));
                        existingTeam.setCity(clean(request.getCity()));
                }

                // Tournament
                if (request.getTournamentId() != null) {

                        Tournament tournament = tournamentRepository
                                        .findById(request.getTournamentId())
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Tournament not found with id: "
                                                                        + request.getTournamentId()));

                        existingTeam.setTournament(tournament);
                }

                Team updatedTeam = teamRepository.save(existingTeam);

                return convertToResponse(updatedTeam);
        }

        // =========================================================
        // DELETE TEAM
        // =========================================================

        @Override
        public void deleteTeam(Long id) {
                if (id == null) throw new IllegalArgumentException("Team ID cannot be null");
                Team team = teamRepository.findById(id).orElseThrow(() -> new RuntimeException("Team not found with id: " + id));
                // Matches/innings reference the team; those must be removed first.
                // Dependencies are handled by MatchService in normal flows, but we delete here transactionally.
                for (var match : matchRepository.findByTeamAIdOrTeamBId(id, id)) {
                        Long matchId = match.getId();
                        inningsRepository.findByMatch_IdOrderByInningsNumberAsc(matchId).forEach(inningsRepository::delete);
                        scoreRepository.findByMatchId(matchId).ifPresent(scoreRepository::delete);
                        matchRepository.delete(match);
                }
                teamRepository.delete(team);
        }

        // =========================================================
        // ENTITY -> RESPONSE
        // =========================================================

        private TeamResponse convertToResponse(Team team) {

                TeamResponse response = new TeamResponse();

                // -----------------------------------------------------
                // BASIC TEAM DATA
                // -----------------------------------------------------

                response.setId(team.getId());

                response.setTeamName(team.getTeamName());
                response.setShortName(team.getShortName());

                response.setCaptain(
                                team.getCaptain());

                response.setCoach(team.getCoach());
                response.setCity(team.getCity());

                // -----------------------------------------------------
                // TOURNAMENT DATA
                // -----------------------------------------------------

                if (team.getTournament() != null) {

                        response.setTournamentId(
                                        team.getTournament().getId());

                        response.setTournamentName(
                                        team.getTournament().getTournamentName());

                } else {

                        response.setTournamentId(null);
                        response.setTournamentName(null);
                }

                // -----------------------------------------------------
                // DEFAULT VALUES
                // -----------------------------------------------------

                /*
                 * Your current Team entity/service does not appear to
                 * contain player/match statistics directly.
                 *
                 * Therefore return safe default values instead of
                 * causing NullPointerException.
                 */

                response.setPlayersCount(team.getPlayers() == null ? 0 : team.getPlayers().size());
                response.setMatches(0);
                response.setWins(0);
                response.setLosses(0);

                response.setStatus("ACTIVE");

                return response;
        }

        // =========================================================
        // CLEAN STRING
        // =========================================================

        private String clean(String value) {

                if (value == null) {
                        return null;
                }

                String result = value.trim();

                return result.isEmpty()
                                ? null
                                : result;
        }
}
