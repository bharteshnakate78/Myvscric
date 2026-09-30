package mycric.service.impl;

import mycric.entity.Innings;
import mycric.entity.Match;
import mycric.repository.InningsRepository;
import mycric.repository.MatchRepository;
import mycric.service.InningsService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class InningsServiceImpl implements InningsService {

    private final InningsRepository inningsRepository;
    private final MatchRepository matchRepository;

    public InningsServiceImpl(
            InningsRepository inningsRepository,
            MatchRepository matchRepository) {

        this.inningsRepository = inningsRepository;
        this.matchRepository = matchRepository;
    }

    // =========================================================
    // CREATE INNINGS
    // =========================================================

    @Override
    public Innings createInnings(Innings innings) {

        if (innings == null) {
            throw new IllegalArgumentException(
                    "Innings data cannot be null");
        }

        if (innings.getMatch() == null ||
                innings.getMatch().getId() == null) {

            throw new IllegalArgumentException(
                    "Match ID is required");
        }

        Long matchId = innings.getMatch().getId();

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException(
                        "Match not found with ID: " + matchId));

        innings.setMatch(match);

        if (innings.getInningsNumber() == null) {
            throw new IllegalArgumentException(
                    "Innings number is required");
        }

        if (inningsRepository
                .existsByMatch_IdAndInningsNumber(
                        matchId,
                        innings.getInningsNumber())) {

            throw new IllegalArgumentException(
                    "Innings " +
                            innings.getInningsNumber() +
                            " already exists for match " +
                            matchId);
        }

        // Safe defaults
        if (innings.getRuns() == null) {
            innings.setRuns(0);
        }

        if (innings.getWickets() == null) {
            innings.setWickets(0);
        }

        if (innings.getOvers() == null) {
            innings.setOvers(0);
        }

        if (innings.getBalls() == null) {
            innings.setBalls(0);
        }

        if (innings.getStatus() == null ||
                innings.getStatus().trim().isEmpty()) {

            innings.setStatus("LIVE");
        }

        return inningsRepository.save(innings);
    }

    // =========================================================
    // GET BY ID
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public Innings getInningsById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "Innings ID is required");
        }

        return inningsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Innings not found with ID: " + id));
    }

    // =========================================================
    // GET ALL INNINGS OF MATCH
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<Innings> getInningsByMatch(Long matchId) {

        if (matchId == null) {
            throw new IllegalArgumentException(
                    "Match ID is required");
        }

        // Verify match exists
        if (!matchRepository.existsById(matchId)) {
            throw new RuntimeException(
                    "Match not found with ID: " + matchId);
        }

        return inningsRepository
                .findByMatch_IdOrderByInningsNumberAsc(matchId);
    }

    // =========================================================
    // GET CURRENT INNINGS
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public Innings getCurrentInnings(Long matchId) {

        if (matchId == null) {
            throw new IllegalArgumentException(
                    "Match ID is required");
        }

        if (!matchRepository.existsById(matchId)) {
            throw new RuntimeException(
                    "Match not found with ID: " + matchId);
        }

        return inningsRepository
                .findTopByMatch_IdOrderByInningsNumberDesc(matchId)
                .orElse(null);
    }

    // =========================================================
    // UPDATE
    // =========================================================

    @Override
    public Innings updateInnings(
            Long id,
            Innings updatedInnings) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "Innings ID is required");
        }

        if (updatedInnings == null) {
            throw new IllegalArgumentException(
                    "Innings data cannot be null");
        }

        Innings existing = inningsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Innings not found with ID: " + id));

        // -----------------------------------------------------
        // MATCH
        // -----------------------------------------------------

        if (updatedInnings.getMatch() != null &&
                updatedInnings.getMatch().getId() != null) {

            Long matchId = updatedInnings.getMatch().getId();

            Match match = matchRepository.findById(matchId)
                    .orElseThrow(() -> new RuntimeException(
                            "Match not found with ID: " + matchId));

            existing.setMatch(match);
        }

        // -----------------------------------------------------
        // INNINGS NUMBER
        // -----------------------------------------------------

        if (updatedInnings.getInningsNumber() != null) {

            existing.setInningsNumber(
                    updatedInnings.getInningsNumber());
        }

        // -----------------------------------------------------
        // TEAMS
        // -----------------------------------------------------

        if (updatedInnings.getBattingTeam() != null) {
            existing.setBattingTeam(
                    updatedInnings.getBattingTeam());
        }

        if (updatedInnings.getBowlingTeam() != null) {
            existing.setBowlingTeam(
                    updatedInnings.getBowlingTeam());
        }

        // -----------------------------------------------------
        // SCORE
        // -----------------------------------------------------

        if (updatedInnings.getRuns() != null) {
            existing.setRuns(
                    updatedInnings.getRuns());
        }

        if (updatedInnings.getWickets() != null) {
            existing.setWickets(
                    updatedInnings.getWickets());
        }

        if (updatedInnings.getOvers() != null) {
            existing.setOvers(
                    updatedInnings.getOvers());
        }

        if (updatedInnings.getBalls() != null) {
            existing.setBalls(
                    updatedInnings.getBalls());
        }

        // -----------------------------------------------------
        // TARGET
        // -----------------------------------------------------

        if (updatedInnings.getTarget() != null) {
            existing.setTarget(
                    updatedInnings.getTarget());
        }

        // -----------------------------------------------------
        // STATUS
        // -----------------------------------------------------

        if (updatedInnings.getStatus() != null &&
                !updatedInnings.getStatus().trim().isEmpty()) {

            existing.setStatus(
                    updatedInnings.getStatus());
        }

        return inningsRepository.save(existing);
    }

    // =========================================================
    // DELETE
    // =========================================================

    @Override
    public void deleteInnings(Long id) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "Innings ID is required");
        }

        if (!inningsRepository.existsById(id)) {
            throw new RuntimeException(
                    "Innings not found with ID: " + id);
        }

        inningsRepository.deleteById(id);
    }
}