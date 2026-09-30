package mycric.service;

import mycric.entity.Tournament;
import java.util.List;

public interface TournamentService {

    Tournament saveTournament(Tournament tournament);

    List<Tournament> getAllTournaments();

    Tournament getTournamentById(Long id);

    Tournament updateTournament(Long id, Tournament tournament);

    void deleteTournament(Long id);

}