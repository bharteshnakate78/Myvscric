
package mycric.service;

import mycric.dto.TeamRequest;
import mycric.dto.TeamResponse;

import java.util.List;

public interface TeamService {

    TeamResponse saveTeam(TeamRequest request);

    List<TeamResponse> getAllTeams();

    TeamResponse getTeamById(Long id);

    List<TeamResponse> getTeamsByTournament(Long tournamentId);

    TeamResponse updateTeam(Long id, TeamRequest request);

    void deleteTeam(Long id);
}