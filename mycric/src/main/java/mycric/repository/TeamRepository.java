
package mycric.repository;

import mycric.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findAllByOrderByTeamNameAsc();

    List<Team> findByTournamentId(Long tournamentId);

    java.util.Optional<Team> findByTeamNameIgnoreCase(String teamName);
}
