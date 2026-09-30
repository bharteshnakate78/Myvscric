
package mycric.controller;

import mycric.entity.Tournament;
import mycric.service.TournamentService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174"
        },
        allowedHeaders = "*",
        methods = {
                RequestMethod.GET,
                RequestMethod.POST,
                RequestMethod.PUT,
                RequestMethod.DELETE,
                RequestMethod.OPTIONS
        }
)
public class TournamentController {

    private final TournamentService tournamentService;

    public TournamentController(
            TournamentService tournamentService) {

        this.tournamentService = tournamentService;
    }

    // =========================================================
    // CREATE TOURNAMENT
    // POST /api/tournaments
    // =========================================================

    @PostMapping
    public ResponseEntity<Tournament> create(
            @RequestBody Tournament tournament) {

        System.out.println(
                "========================================"
        );

        System.out.println(
                "CREATE TOURNAMENT REQUEST"
        );

        System.out.println(
                "NAME: "
                        + tournament.getTournamentName()
        );

        Tournament savedTournament =
                tournamentService.saveTournament(
                        tournament
                );

        System.out.println(
                "TOURNAMENT CREATED: ID = "
                        + savedTournament.getId()
        );

        System.out.println(
                "========================================"
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedTournament);
    }

    // =========================================================
    // GET ALL TOURNAMENTS
    // GET /api/tournaments
    // =========================================================

    @GetMapping
    public ResponseEntity<List<Tournament>> getAll() {

        return ResponseEntity.ok(
                tournamentService.getAllTournaments()
        );
    }

    // =========================================================
    // GET TOURNAMENT BY ID
    // GET /api/tournaments/{id}
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<Tournament> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                tournamentService.getTournamentById(id)
        );
    }

    // =========================================================
    // UPDATE TOURNAMENT
    // PUT /api/tournaments/{id}
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<Tournament> update(
            @PathVariable Long id,
            @RequestBody Tournament tournament) {

        Tournament updatedTournament =
                tournamentService.updateTournament(
                        id,
                        tournament
                );

        return ResponseEntity.ok(
                updatedTournament
        );
    }

    // =========================================================
    // DELETE TOURNAMENT
    // DELETE /api/tournaments/{id}
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(
            @PathVariable Long id) {

        tournamentService.deleteTournament(id);

        return ResponseEntity.ok(
                "Tournament Deleted Successfully"
        );
    }
}
