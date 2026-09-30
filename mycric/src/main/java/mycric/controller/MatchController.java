package mycric.controller;

import mycric.dto.MatchRequest;
import mycric.entity.Match;
import mycric.service.MatchService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@CrossOrigin(origins = "*")
public class MatchController {

    @Autowired
    private MatchService matchService;

    // =========================================================
    // CREATE MATCH
    // POST /api/matches
    // =========================================================

    @PostMapping
    public Match save(
            @RequestBody MatchRequest request) {

        return matchService.saveMatch(request);
    }

    // =========================================================
    // GET ALL
    // GET /api/matches
    // =========================================================

    @GetMapping
    public List<Match> getAll() {

        return matchService.getAllMatches();
    }

    // =========================================================
    // GET BY ID
    // GET /api/matches/{id}
    // =========================================================

    @GetMapping("/{id}")
    public Match getById(
            @PathVariable Long id) {

        return matchService.getMatchById(id);
    }

    // =========================================================
    // GET BY STATUS
    // GET /api/matches/status/{status}
    // =========================================================

    @GetMapping("/status/{status}")
    public List<Match> getByStatus(
            @PathVariable String status) {

        return matchService.getMatchesByStatus(status);
    }

    // =========================================================
    // GET BY TOURNAMENT
    // GET /api/matches/tournament/{tournamentId}
    // =========================================================

    @GetMapping("/tournament/{tournamentId}")
    public List<Match> getByTournament(
            @PathVariable Long tournamentId) {

        return matchService
                .getMatchesByTournament(tournamentId);
    }

    // =========================================================
    // START MATCH
    // POST /api/matches/{matchId}/start
    // =========================================================

    @PostMapping("/{matchId}/start")
    public Match startMatch(
            @PathVariable Long matchId) {

        return matchService.startMatch(matchId);
    }

    // =========================================================
    // UPDATE
    // PUT /api/matches/{id}
    // =========================================================

    @PutMapping("/{id}")
    public Match update(
            @PathVariable Long id,
            @RequestBody MatchRequest request) {

        return matchService.updateMatch(
                id,
                request
        );
    }

    // =========================================================
    // DELETE
    // DELETE /api/matches/{id}
    // =========================================================

    @DeleteMapping("/{id}")
    public String delete(
            @PathVariable Long id) {

        matchService.deleteMatch(id);

        return "Match Deleted Successfully";
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
// public class MatchController {

//     @Autowired
//     private MatchService matchService;

//     @PostMapping
//     public Match save(@RequestBody MatchRequest request) {
//         return matchService.saveMatch(request);
//     }

//     @GetMapping
//     public List<Match> getAll() {
//         return matchService.getAllMatches();
//     }

//     @GetMapping("/{id}")
//     public Match getById(@PathVariable Long id) {
//         return matchService.getMatchById(id);
//     }

//     @GetMapping("/status/{status}")
//     public List<Match> getByStatus(
//             @PathVariable String status) {

//         return matchService.getMatchesByStatus(status);
//     }

//     @GetMapping("/tournament/{tournamentId}")
//     public List<Match> getByTournament(@PathVariable Long tournamentId) {
//         return matchService.getMatchesByTournament(tournamentId);
//     }

//     @PutMapping("/{id}")
//     public Match update(
//             @PathVariable Long id,
//             @RequestBody MatchRequest request) {

//         return matchService.updateMatch(id, request);
//     }

//     @DeleteMapping("/{id}")
//     public String delete(@PathVariable Long id) {

//         matchService.deleteMatch(id);

//         return "Match Deleted Successfully";
//     }
// }
