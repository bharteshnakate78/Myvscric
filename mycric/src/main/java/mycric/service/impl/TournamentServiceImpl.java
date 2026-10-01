
package mycric.service.impl;

import mycric.entity.Tournament;
import mycric.repository.TournamentRepository;
import mycric.repository.TeamRepository;
import mycric.repository.MatchRepository;
import mycric.repository.InningsRepository;
import mycric.repository.ScoreRepository;
import mycric.service.TournamentService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TournamentServiceImpl
                implements TournamentService {

        private final TournamentRepository tournamentRepository;
        private final TeamRepository teamRepository;
        private final MatchRepository matchRepository;
        private final InningsRepository inningsRepository;
        private final ScoreRepository scoreRepository;

        public TournamentServiceImpl(
                        TournamentRepository tournamentRepository,
                        TeamRepository teamRepository, MatchRepository matchRepository,
                        InningsRepository inningsRepository, ScoreRepository scoreRepository) {

                this.tournamentRepository = tournamentRepository;
                this.teamRepository = teamRepository;
                this.matchRepository = matchRepository;
                this.inningsRepository = inningsRepository;
                this.scoreRepository = scoreRepository;
        }

        // =========================================================
        // CREATE
        // =========================================================

        @Override
        public Tournament saveTournament(
                        Tournament tournament) {

                if (tournament == null) {
                        throw new IllegalArgumentException(
                                        "Tournament data cannot be null");
                }

                // -----------------------------------------------------
                // NAME
                // -----------------------------------------------------

                if (tournament.getTournamentName() == null ||
                                tournament.getTournamentName()
                                                .trim()
                                                .isEmpty()) {

                        throw new IllegalArgumentException(
                                        "Tournament name is required");
                }

                tournament.setTournamentName(
                                tournament.getTournamentName()
                                                .trim());

                // -----------------------------------------------------
                // SHORT NAME
                // -----------------------------------------------------

                if (tournament.getShortName() != null) {

                        tournament.setShortName(
                                        tournament.getShortName()
                                                        .trim());
                }

                // -----------------------------------------------------
                // FORMAT
                // -----------------------------------------------------

                if (tournament.getFormat() != null) {

                        tournament.setFormat(
                                        tournament.getFormat()
                                                        .trim()
                                                        .toUpperCase());
                }

                // -----------------------------------------------------
                // LOCATION
                // -----------------------------------------------------

                if (tournament.getLocation() != null) {

                        tournament.setLocation(
                                        tournament.getLocation()
                                                        .trim());
                }

                // -----------------------------------------------------
                // ORGANIZER
                // -----------------------------------------------------

                if (tournament.getOrganizer() != null) {

                        tournament.setOrganizer(
                                        tournament.getOrganizer()
                                                        .trim());
                }

                // -----------------------------------------------------
                // DESCRIPTION
                // -----------------------------------------------------

                if (tournament.getDescription() != null) {

                        tournament.setDescription(
                                        tournament.getDescription()
                                                        .trim());
                }

                // -----------------------------------------------------
                // STATUS
                // -----------------------------------------------------

                if (tournament.getStatus() == null ||
                                tournament.getStatus()
                                                .trim()
                                                .isEmpty()) {

                        tournament.setStatus("UPCOMING");

                } else {

                        tournament.setStatus(
                                        tournament.getStatus()
                                                        .trim()
                                                        .toUpperCase());
                }

                // -----------------------------------------------------
                // DATE VALIDATION
                // -----------------------------------------------------

                validateDates(tournament);

                // -----------------------------------------------------
                // CREATE MUST ALWAYS INSERT
                // -----------------------------------------------------

                tournament.setId(null);

                // -----------------------------------------------------
                // SAVE
                // -----------------------------------------------------

                Tournament savedTournament = tournamentRepository.save(
                                tournament);

                tournamentRepository.flush();

                System.out.println(
                                "========================================");

                System.out.println(
                                "TOURNAMENT SAVED SUCCESSFULLY");

                System.out.println(
                                "ID        : "
                                                + savedTournament.getId());

                System.out.println(
                                "NAME      : "
                                                + savedTournament.getTournamentName());

                System.out.println(
                                "SHORT NAME: "
                                                + savedTournament.getShortName());

                System.out.println(
                                "FORMAT    : "
                                                + savedTournament.getFormat());

                System.out.println(
                                "LOCATION  : "
                                                + savedTournament.getLocation());

                System.out.println(
                                "START DATE: "
                                                + savedTournament.getStartDate());

                System.out.println(
                                "END DATE  : "
                                                + savedTournament.getEndDate());

                System.out.println(
                                "STATUS    : "
                                                + savedTournament.getStatus());

                System.out.println(
                                "ORGANIZER : "
                                                + savedTournament.getOrganizer());

                System.out.println(
                                "========================================");

                return savedTournament;
        }

        // =========================================================
        // GET ALL
        // =========================================================

        @Override
        @Transactional(readOnly = true)
        public List<Tournament> getAllTournaments() {

                return tournamentRepository.findAll();
        }

        // =========================================================
        // GET BY ID
        // =========================================================

        @Override
        @Transactional(readOnly = true)
        public Tournament getTournamentById(
                        Long id) {

                if (id == null) {

                        throw new IllegalArgumentException(
                                        "Tournament ID cannot be null");
                }

                return tournamentRepository
                                .findById(id)
                                .orElseThrow(() -> new RuntimeException(
                                                "Tournament not found with id: "
                                                                + id));
        }

        // =========================================================
        // UPDATE
        // =========================================================

        @Override
        public Tournament updateTournament(
                        Long id,
                        Tournament tournament) {

                if (id == null) {

                        throw new IllegalArgumentException(
                                        "Tournament ID cannot be null");
                }

                if (tournament == null) {

                        throw new IllegalArgumentException(
                                        "Tournament data cannot be null");
                }

                Tournament existingTournament = tournamentRepository
                                .findById(id)
                                .orElseThrow(() -> new RuntimeException(
                                                "Tournament not found with id: "
                                                                + id));

                // -----------------------------------------------------
                // NAME
                // -----------------------------------------------------

                if (tournament.getTournamentName() != null &&
                                !tournament.getTournamentName()
                                                .trim()
                                                .isEmpty()) {

                        existingTournament.setTournamentName(
                                        tournament.getTournamentName()
                                                        .trim());
                }

                // -----------------------------------------------------
                // SHORT NAME
                // -----------------------------------------------------

                if (tournament.getShortName() != null) {

                        existingTournament.setShortName(
                                        tournament.getShortName()
                                                        .trim());
                }

                // -----------------------------------------------------
                // FORMAT
                // -----------------------------------------------------

                if (tournament.getFormat() != null) {

                        existingTournament.setFormat(
                                        tournament.getFormat()
                                                        .trim()
                                                        .toUpperCase());
                }

                // -----------------------------------------------------
                // LOCATION
                // -----------------------------------------------------

                if (tournament.getLocation() != null) {

                        existingTournament.setLocation(
                                        tournament.getLocation()
                                                        .trim());
                }

                // -----------------------------------------------------
                // START DATE
                // -----------------------------------------------------

                existingTournament.setStartDate(
                                tournament.getStartDate());

                // -----------------------------------------------------
                // END DATE
                // -----------------------------------------------------

                existingTournament.setEndDate(
                                tournament.getEndDate());

                // -----------------------------------------------------
                // STATUS
                // -----------------------------------------------------

                if (tournament.getStatus() != null &&
                                !tournament.getStatus()
                                                .trim()
                                                .isEmpty()) {

                        existingTournament.setStatus(
                                        tournament.getStatus()
                                                        .trim()
                                                        .toUpperCase());
                }

                // -----------------------------------------------------
                // ORGANIZER
                // -----------------------------------------------------

                if (tournament.getOrganizer() != null) {

                        existingTournament.setOrganizer(
                                        tournament.getOrganizer()
                                                        .trim());
                }

                // -----------------------------------------------------
                // DESCRIPTION
                // -----------------------------------------------------

                if (tournament.getDescription() != null) {

                        existingTournament.setDescription(
                                        tournament.getDescription()
                                                        .trim());
                }

                // -----------------------------------------------------
                // DATE VALIDATION
                // -----------------------------------------------------

                validateDates(existingTournament);

                // -----------------------------------------------------
                // SAVE
                // -----------------------------------------------------

                Tournament updatedTournament = tournamentRepository.save(
                                existingTournament);

                tournamentRepository.flush();

                System.out.println(
                                "TOURNAMENT UPDATED SUCCESSFULLY: ID = "
                                                + updatedTournament.getId());

                return updatedTournament;
        }

        // =========================================================
        // DELETE
        // =========================================================

        @Override
        public void deleteTournament(Long id) {
                if (id == null)
                        throw new IllegalArgumentException("Tournament ID cannot be null");
                Tournament tournament = tournamentRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Tournament not found with id: " + id));
                for (var match : matchRepository.findByTournamentId(id)) {
                        Long matchId = match.getId();
                        inningsRepository.findByMatch_IdOrderByInningsNumberAsc(matchId)
                                        .forEach(inningsRepository::delete);
                        scoreRepository.findByMatchId(matchId).ifPresent(scoreRepository::delete);
                        matchRepository.delete(match);
                }
                for (var team : teamRepository.findByTournamentId(id)) {
                        teamRepository.delete(team);
                }
                tournamentRepository.delete(tournament);
                tournamentRepository.flush();
        }

        // =========================================================
        // DATE VALIDATION
        // =========================================================

        private void validateDates(
                        Tournament tournament) {

                if (tournament.getStartDate() != null &&
                                tournament.getEndDate() != null &&
                                tournament.getEndDate()
                                                .isBefore(
                                                                tournament.getStartDate())) {

                        throw new IllegalArgumentException(
                                        "End date cannot be before start date");
                }
        }
}
