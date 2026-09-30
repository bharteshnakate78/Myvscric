package mycric.websocket;

import mycric.dto.MatchDTO;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class MatchSocketController {

    @MessageMapping("/match")
    @SendTo("/topic/matches")
    public MatchDTO updateMatch(MatchDTO match) {
        return match;
    }
}

//package websocket;
//
//import dto.MatchDTO;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.messaging.handler.annotation.MessageMapping;
//import org.springframework.messaging.handler.annotation.SendTo;
//import org.springframework.stereotype.Controller;
//
//@Controller
//public class MatchSocketController {
//
//    @Autowired
//    private ScorePublisher scorePublisher;
//
//    // Frontend sends match updates to /app/match
//    @MessageMapping("/match")
//    @SendTo("/topic/matches")
//    public MatchDTO updateMatch(MatchDTO match) {
//
//        return match;
//    }
//}