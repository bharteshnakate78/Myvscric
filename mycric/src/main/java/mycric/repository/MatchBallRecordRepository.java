package mycric.repository;

import mycric.entity.MatchBallRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MatchBallRecordRepository extends JpaRepository<MatchBallRecord, Long> {
    List<MatchBallRecord> findByMatchId(Long matchId);
}
