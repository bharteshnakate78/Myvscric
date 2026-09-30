package mycric.service;

import mycric.dto.ScoreRequest;
import mycric.entity.Score;

import java.util.List;
import java.util.Optional;

public interface ScoreService {

    Score saveScore(Score score);

    List<Score> getAllScores();

    Optional<Score> getScoreByMatch(Long matchId);

    Score createScore(Long matchId, ScoreRequest request);

    Score updateScore(Long scoreId, ScoreRequest request);

    Score recordBall(ScoreRequest request);

    Score recordWicket(ScoreRequest request);

    Score recordWide(ScoreRequest request);

    Score recordNoBall(ScoreRequest request);

    Score recordWideWicket(ScoreRequest request);

    Score recordNoBallWicket(ScoreRequest request);

    Score undoLastBall(Long matchId);

    Score resetScore(Long scoreId);

    Score resetForNewInnings(Long matchId);

    void deleteScore(Long scoreId);
}