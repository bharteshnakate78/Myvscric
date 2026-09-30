package mycric.service;

import mycric.dto.MatchRequest;
import mycric.entity.Match;

import java.util.List;

public interface MatchService {

    Match saveMatch(Match match);

    Match saveMatch(MatchRequest request);

    List<Match> getAllMatches();

    Match getMatchById(Long id);

    List<Match> getMatchesByStatus(String status);

    List<Match> getMatchesByTournament(Long tournamentId);

    Match updateMatch(Long id, Match match);

    Match updateMatch(Long id, MatchRequest request);

    void deleteMatch(Long id);

    // =========================================================
    // START MATCH
    // =========================================================

    Match startMatch(Long matchId);
}

// package mycric.service;

// import mycric.entity.Match;
// import mycric.dto.MatchRequest;
// import java.util.List;

// public interface MatchService {

//     Match saveMatch(Match match);

//     Match saveMatch(MatchRequest request);

//     List<Match> getAllMatches();

//     Match getMatchById(Long id);

//     List<Match> getMatchesByStatus(String status);

//     List<Match> getMatchesByTournament(Long tournamentId);

//     Match updateMatch(Long id, Match match);

//     Match updateMatch(Long id, MatchRequest request);

//     void deleteMatch(Long id);

// }