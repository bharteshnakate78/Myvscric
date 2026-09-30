package mycric.service;

import mycric.entity.Innings;

import java.util.List;

public interface InningsService {

    // CREATE
    Innings createInnings(Innings innings);

    // READ
    Innings getInningsById(Long id);

    List<Innings> getInningsByMatch(Long matchId);

    Innings getCurrentInnings(Long matchId);

    // UPDATE
    Innings updateInnings(Long id, Innings innings);

    // DELETE
    void deleteInnings(Long id);
}