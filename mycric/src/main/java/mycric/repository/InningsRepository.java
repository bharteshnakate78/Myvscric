package mycric.repository;

import mycric.entity.Innings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InningsRepository
        extends JpaRepository<Innings, Long> {

    List<Innings> findByMatch_IdOrderByInningsNumberAsc(
            Long matchId);

    Optional<Innings> findByMatch_IdAndInningsNumber(
            Long matchId,
            Integer inningsNumber);
}

// package mycric.repository;
// import mycric.entity.Innings; import
// org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
// import java.util.Optional;
// public interface InningsRepository extends JpaRepository<Innings,Long>{
// List<Innings> findByMatch_IdOrderByInningsNumberAsc(Long matchId);
// Optional<Innings> findByMatch_IdAndInningsNumber(Long matchId,Integer
// inningsNumber);
// boolean existsByMatch_IdAndInningsNumber(Long matchId,Integer inningsNumber);
// Optional<Innings> findTopByMatch_IdOrderByInningsNumberDesc(Long matchId);
// Optional<Innings> findFirstByMatch_IdAndStatus(Long matchId,String status);
// List<Innings> findByBattingTeamIdOrBowlingTeamId(Long battingTeamId, Long
// bowlingTeamId);
// }
