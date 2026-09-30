package mycric.websocket;

import mycric.dto.ScoreDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class ScorePublisher {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void publishScore(ScoreDTO score) {

        messagingTemplate.convertAndSend(
                "/topic/scores/" + score.getMatchId(),
                score
        );
    }
}