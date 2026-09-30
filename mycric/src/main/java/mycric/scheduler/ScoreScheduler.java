package mycric.scheduler;

import mycric.dto.ScoreDTO;
import mycric.entity.Score;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import mycric.repository.ScoreRepository;
import mycric.websocket.ScorePublisher;

import java.util.List;

@Component
public class ScoreScheduler {

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private ScorePublisher scorePublisher;

    // Runs every 10 seconds
    @Scheduled(fixedRate = 10000)
    public void publishLiveScores() {

        List<Score> scores = scoreRepository.findAll();

        for (Score score : scores) {

            // Check Score has Match
            if (score.getMatch() == null) {
                continue;
            }

            // Check Match is LIVE
            if (score.getMatch().getStatus() == null ||
                    !score.getMatch()
                            .getStatus()
                            .equalsIgnoreCase("LIVE")) {
                continue;
            }

            // Create ScoreDTO
            ScoreDTO scoreDTO = new ScoreDTO();

            scoreDTO.setId(score.getId());

            scoreDTO.setMatchId(
                    score.getMatch().getId()
            );

            scoreDTO.setRuns(
                    score.getRuns()
            );

            scoreDTO.setWickets(
                    score.getWickets()
            );

            scoreDTO.setOvers(
                    score.getOvers()
            );

            scoreDTO.setStriker(
                    score.getStriker()
            );

            scoreDTO.setNonStriker(
                    score.getNonStriker()
            );

            scoreDTO.setBowler(
                    score.getBowler()
            );

            // Publish live score
            scorePublisher.publishScore(scoreDTO);

            System.out.println(
                    "Live score published for Match ID: "
                            + score.getMatch().getId()
            );
        }
    }
}