package mycric.controller;

import mycric.dto.MatchRequest;
import mycric.entity.Match;
import mycric.service.MatchService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    @Autowired
    private MatchService matchService;

    // =========================================================
    // CREATE MATCH
    // =========================================================

    @PostMapping
    public ResponseEntity<?> save(
            @RequestBody MatchRequest request) {

        try {

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(
                            matchService.saveMatch(request));

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            "Unable to create match: "
                                    + e.getMessage());
        }
    }

    // =========================================================
    // GET ALL
    // =========================================================

    @GetMapping
    public ResponseEntity<List<Match>> getAll() {

        return ResponseEntity.ok(
                matchService.getAllMatches());
    }

    // =========================================================
    // GET BY ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @PathVariable Long id) {

        Match match = matchService.getMatchById(id);

        if (match == null) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            "Match not found: " + id);
        }

        return ResponseEntity.ok(match);
    }

    // =========================================================
    // GET BY STATUS
    // =========================================================

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Match>> getByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(
                matchService.getMatchesByStatus(status));
    }

    // =========================================================
    // GET BY TOURNAMENT
    // =========================================================

    @GetMapping("/tournament/{tournamentId}")
    public ResponseEntity<List<Match>> getByTournament(
            @PathVariable Long tournamentId) {

        return ResponseEntity.ok(
                matchService.getMatchesByTournament(
                        tournamentId));
    }

    // =========================================================
    // START MATCH
    // =========================================================

    @PostMapping("/{matchId}/start")
    public ResponseEntity<?> startMatch(
            @PathVariable Long matchId) {

        try {

            Match startedMatch = matchService.startMatch(matchId);

            return ResponseEntity.ok(
                    startedMatch);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());

        } catch (IllegalStateException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            "Unable to start match: "
                                    + e.getMessage());
        }
    }

    // =========================================================
    // UPDATE
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody MatchRequest request) {

        try {

            return ResponseEntity.ok(
                    matchService.updateMatch(
                            id,
                            request));

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            "Unable to update match: "
                                    + e.getMessage());
        }
    }

    // =========================================================
    // DELETE
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id) {

        try {

            matchService.deleteMatch(id);

            return ResponseEntity.ok(
                    "Match deleted successfully");

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            "Unable to delete match: "
                                    + e.getMessage());
        }
    }
}

// package mycric.controller;

// import mycric.dto.MatchRequest;
// import mycric.entity.Match;
// import mycric.service.MatchService;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;

// @RestController
// @RequestMapping("/api/matches")
// // @CrossOrigin(origins = "*")
// public class MatchController {

// @Autowired
// private MatchService matchService;

// // =========================================================
// // CREATE MATCH
// // POST /api/matches
// // =========================================================

// @PostMapping
// public Match save(
// @RequestBody MatchRequest request) {

// return matchService.saveMatch(request);
// }

// // =========================================================
// // GET ALL
// // GET /api/matches
// // =========================================================

// @GetMapping
// public List<Match> getAll() {

// return matchService.getAllMatches();
// }

// // =========================================================
// // GET BY ID
// // GET /api/matches/{id}
// // =========================================================

// @GetMapping("/{id}")
// public Match getById(
// @PathVariable Long id) {

// return matchService.getMatchById(id);
// }

// // =========================================================
// // GET BY STATUS
// // GET /api/matches/status/{status}
// // =========================================================

// @GetMapping("/status/{status}")
// public List<Match> getByStatus(
// @PathVariable String status) {

// return matchService.getMatchesByStatus(status);
// }

// // =========================================================
// // GET BY TOURNAMENT
// // GET /api/matches/tournament/{tournamentId}
// // =========================================================

// @GetMapping("/tournament/{tournamentId}")
// public List<Match> getByTournament(
// @PathVariable Long tournamentId) {

// return matchService
// .getMatchesByTournament(tournamentId);
// }

// // =========================================================
// // START MATCH
// // POST /api/matches/{matchId}/start
// // =========================================================

// @PostMapping("/{matchId}/start")
// public Match startMatch(
// @PathVariable Long matchId) {

// return matchService.startMatch(matchId);
// }

// // =========================================================
// // UPDATE
// // PUT /api/matches/{id}
// // =========================================================

// @PutMapping("/{id}")
// public Match update(
// @PathVariable Long id,
// @RequestBody MatchRequest request) {

// return matchService.updateMatch(
// id,
// request
// );
// }

// // =========================================================
// // DELETE
// // DELETE /api/matches/{id}
// // =========================================================

// @DeleteMapping("/{id}")
// public String delete(
// @PathVariable Long id) {

// matchService.deleteMatch(id);

// return "Match Deleted Successfully";
// }
// }
// // package mycric.controller;

// // import mycric.dto.MatchRequest;
// // import mycric.entity.Match;
// // import mycric.service.MatchService;

// // import org.springframework.beans.factory.annotation.Autowired;
// // import org.springframework.web.bind.annotation.*;

// // import java.util.List;

// // @RestController
// // @RequestMapping("/api/matches")
// // public class MatchController {

// // @Autowired
// // private MatchService matchService;

// // @PostMapping
// // public Match save(@RequestBody MatchRequest request) {
// // return matchService.saveMatch(request);
// // }

// // @GetMapping
// // public List<Match> getAll() {
// // return matchService.getAllMatches();
// // }

// // @GetMapping("/{id}")
// // public Match getById(@PathVariable Long id) {
// // return matchService.getMatchById(id);
// // }

// // @GetMapping("/status/{status}")
// // public List<Match> getByStatus(
// // @PathVariable String status) {

// // return matchService.getMatchesByStatus(status);
// // }

// // @GetMapping("/tournament/{tournamentId}")
// // public List<Match> getByTournament(@PathVariable Long tournamentId) {
// // return matchService.getMatchesByTournament(tournamentId);
// // }

// // @PutMapping("/{id}")
// // public Match update(
// // @PathVariable Long id,
// // @RequestBody MatchRequest request) {

// // return matchService.updateMatch(id, request);
// // }

// // @DeleteMapping("/{id}")
// // public String delete(@PathVariable Long id) {

// // matchService.deleteMatch(id);

// // return "Match Deleted Successfully";
// // }
// // }
