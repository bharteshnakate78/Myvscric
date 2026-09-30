package mycric.repository;
import mycric.entity.Match; import org.springframework.data.jpa.repository.JpaRepository; import org.springframework.stereotype.Repository; import java.util.List;
@Repository public interface MatchRepository extends JpaRepository<Match,Long>{
 List<Match> findByStatusIgnoreCase(String status);
 List<Match> findByTournamentId(Long tournamentId);
 List<Match> findByTeamAIdOrTeamBId(Long teamAId, Long teamBId);
}
