package mycric.scheduler;

import mycric.entity.Match;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import mycric.repository.MatchRepository;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Component
public class MatchScheduler {

    @Autowired
    private MatchRepository matchRepository;

    // Runs every 60 seconds
    @Scheduled(fixedRate = 60000)
    public void updateMatchStatus() {

        List<Match> matches = matchRepository.findAll();

        LocalDateTime now = LocalDateTime.now();

        for (Match match : matches) {

            if (match.getMatchDate() == null ||
                    match.getStatus() == null) {
                continue;
            }

            LocalDateTime matchTime;
            try {
                matchTime = LocalDateTime.parse(match.getMatchDate());
            } catch (java.time.format.DateTimeParseException exception) {
                matchTime = LocalDate.parse(match.getMatchDate()).atStartOfDay();
            }

            // UPCOMING -> LIVE
            if (match.getStatus().equalsIgnoreCase("UPCOMING") &&
                    !now.isBefore(matchTime)) {

                match.setStatus("LIVE");

                matchRepository.save(match);

                System.out.println(
                        "Match ID " + match.getId() +
                                " is now LIVE");
            }
        }
    }
}