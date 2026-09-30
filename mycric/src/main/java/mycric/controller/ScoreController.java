
package mycric.controller;

import mycric.dto.ScoreRequest;
import mycric.entity.Score;
import mycric.service.ScoreService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

        @Autowired
        private ScoreService scoreService;

        @PostMapping
        public ResponseEntity<Score> saveScore(
                        @RequestBody Score score) {

                return ResponseEntity.ok(
                                scoreService.saveScore(score));
        }

        @GetMapping
        public ResponseEntity<List<Score>> getAllScores() {

                return ResponseEntity.ok(
                                scoreService.getAllScores());
        }

        @GetMapping("/match/{id}")
        public ResponseEntity<Score> getScoreByMatch(
                        @PathVariable Long id) {

                Optional<Score> score = scoreService.getScoreByMatch(id);

                return score
                                .map(ResponseEntity::ok)
                                .orElse(ResponseEntity.notFound().build());
        }

        @PostMapping("/match/{matchId}")
        public ResponseEntity<Score> createScore(
                        @PathVariable Long matchId,
                        @RequestBody ScoreRequest request) {

                request.setMatchId(matchId);

                return ResponseEntity.ok(
                                scoreService.createScore(matchId, request));
        }

        @PutMapping("/{scoreId}")
        public ResponseEntity<Score> updateScore(
                        @PathVariable Long scoreId,
                        @RequestBody ScoreRequest request) {

                return ResponseEntity.ok(
                                scoreService.updateScore(scoreId, request));
        }

        @PostMapping("/ball")
        public ResponseEntity<Score> recordBall(
                        @RequestBody ScoreRequest request) {

                return ResponseEntity.ok(
                                scoreService.recordBall(request));
        }

        @PostMapping("/match/{matchId}/undo")
        public ResponseEntity<Score> undoLastBall(
                        @PathVariable Long matchId) {

                return ResponseEntity.ok(
                                scoreService.undoLastBall(matchId));
        }

        @PostMapping("/match/{matchId}/start-innings")
        public ResponseEntity<Score> startInnings(
                        @PathVariable Long matchId) {

                return ResponseEntity.ok(
                                scoreService.resetForNewInnings(matchId));
        }

        @DeleteMapping("/{scoreId}")
        public ResponseEntity<Void> deleteScore(@PathVariable Long scoreId) {
                scoreService.deleteScore(scoreId);
                return ResponseEntity.noContent().build();
        }

        @PostMapping("/{scoreId}/reset")
        public ResponseEntity<Score> resetScore(
                        @PathVariable Long scoreId) {

                return ResponseEntity.ok(
                                scoreService.resetScore(scoreId));
        }
}