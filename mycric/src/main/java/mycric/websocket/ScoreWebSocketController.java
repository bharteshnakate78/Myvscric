package mycric.websocket;

import mycric.dto.ScoreDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ScoreWebSocketController {

    @Autowired
    private ScorePublisher scorePublisher;

    @MessageMapping("/score")
    @SendTo("/topic/scores")
    public ScoreDTO updateScore(ScoreDTO score) {

        scorePublisher.publishScore(score);

        return score;
    }
}