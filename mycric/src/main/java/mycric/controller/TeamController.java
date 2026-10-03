
package mycric.controller;

import mycric.dto.TeamRequest;
import mycric.dto.TeamResponse;
import mycric.service.TeamService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
// @CrossOrigin(origins = "*")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<TeamResponse> saveTeam(
            @RequestBody TeamRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(teamService.saveTeam(request));
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<TeamResponse>> getAllTeams() {

        return ResponseEntity.ok(
                teamService.getAllTeams());
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<TeamResponse> getTeamById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                teamService.getTeamById(id));
    }

    // GET BY TOURNAMENT
    @GetMapping("/tournament/{tournamentId}")
    public ResponseEntity<List<TeamResponse>> getTeamsByTournament(
            @PathVariable Long tournamentId) {

        return ResponseEntity.ok(
                teamService.getTeamsByTournament(tournamentId));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable Long id,
            @RequestBody TeamRequest request) {

        return ResponseEntity.ok(
                teamService.updateTeam(id, request));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(
            @PathVariable Long id) {

        teamService.deleteTeam(id);

        return ResponseEntity.noContent().build();
    }
}

// package mycric.controller;

// import mycric.dto.TeamRequest;
// import mycric.dto.TeamResponse;
// import mycric.service.TeamService;

// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;

// @RestController
// @RequestMapping("/api/teams")
// @CrossOrigin(origins = "*")
// public class TeamController {

// private final TeamService teamService;

// public TeamController(TeamService teamService) {
// this.teamService = teamService;
// }

// // =========================================================
// // CREATE TEAM
// // POST /api/teams
// // =========================================================
// @PostMapping
// public ResponseEntity<TeamResponse> saveTeam(
// @RequestBody TeamRequest request) {

// TeamResponse response = teamService.saveTeam(request);

// return ResponseEntity
// .status(HttpStatus.CREATED)
// .body(response);
// }

// // =========================================================
// // GET ALL TEAMS
// // GET /api/teams
// // =========================================================
// @GetMapping
// public ResponseEntity<List<TeamResponse>> getAllTeams() {

// return ResponseEntity.ok(
// teamService.getAllTeams());
// }

// // =========================================================
// // GET TEAM BY ID
// // GET /api/teams/{id}
// // =========================================================
// @GetMapping("/{id}")
// public ResponseEntity<TeamResponse> getTeamById(
// @PathVariable Long id) {

// return ResponseEntity.ok(
// teamService.getTeamById(id));
// }

// // =========================================================
// // GET TEAMS BY TOURNAMENT
// // GET /api/teams/tournament/{tournamentId}
// // =========================================================
// @GetMapping("/tournament/{tournamentId}")
// public ResponseEntity<List<TeamResponse>> getTeamsByTournament(
// @PathVariable Long tournamentId) {

// return ResponseEntity.ok(
// teamService.getTeamsByTournament(tournamentId));
// }

// // =========================================================
// // UPDATE TEAM
// // PUT /api/teams/{id}
// // =========================================================
// @PutMapping("/{id}")
// public ResponseEntity<TeamResponse> updateTeam(
// @PathVariable Long id,
// @RequestBody TeamRequest request) {

// return ResponseEntity.ok(
// teamService.updateTeam(id, request));
// }

// // =========================================================
// // DELETE TEAM
// // DELETE /api/teams/{id}
// // =========================================================
// @DeleteMapping("/{id}")
// public ResponseEntity<Void> deleteTeam(
// @PathVariable Long id) {

// teamService.deleteTeam(id);

// return ResponseEntity.noContent().build();
// }
// }
