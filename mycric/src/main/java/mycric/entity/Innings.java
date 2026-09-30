package mycric.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "innings")
@JsonIgnoreProperties({
        "hibernateLazyInitializer",
        "handler"
})
public class Innings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer balls = 0;

    @Column(name = "innings_number", nullable = false)
    private Integer inningsNumber;

    @Column(nullable = false)
    private Integer overs = 0;

    @Column(nullable = false)
    private Integer runs = 0;

    @Column(nullable = false)
    private String status = "LIVE";

    @Column(nullable = false)
    private Integer target;

    @Column(nullable = false)
    private Integer wickets = 0;

    // =========================================================
    // BATTING TEAM
    // =========================================================

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batting_team_id", nullable = false)
    @JsonIgnoreProperties({
            "players",
            "tournament",
            "hibernateLazyInitializer",
            "handler"
    })
    private Team battingTeam;

    // =========================================================
    // BOWLING TEAM
    // =========================================================

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bowling_team_id", nullable = false)
    @JsonIgnoreProperties({
            "players",
            "tournament",
            "hibernateLazyInitializer",
            "handler"
    })
    private Team bowlingTeam;

    // =========================================================
    // MATCH
    // =========================================================

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "match_id", nullable = false)
    @JsonIgnoreProperties({
            "tournament",
            "teamA",
            "teamB",
            "hibernateLazyInitializer",
            "handler"
    })
    private Match match;

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public Innings() {
    }

    // =========================================================
    // GETTERS
    // =========================================================

    public Long getId() {
        return id;
    }

    public Integer getBalls() {
        return balls;
    }

    public Integer getInningsNumber() {
        return inningsNumber;
    }

    public Integer getOvers() {
        return overs;
    }

    public Integer getRuns() {
        return runs;
    }

    public String getStatus() {
        return status;
    }

    public Integer getTarget() {
        return target;
    }

    public Integer getWickets() {
        return wickets;
    }

    public Team getBattingTeam() {
        return battingTeam;
    }

    public Team getBowlingTeam() {
        return bowlingTeam;
    }

    public Match getMatch() {
        return match;
    }

    // =========================================================
    // SETTERS
    // =========================================================

    public void setId(Long id) {
        this.id = id;
    }

    public void setBalls(Integer balls) {
        this.balls = balls;
    }

    public void setInningsNumber(Integer inningsNumber) {
        this.inningsNumber = inningsNumber;
    }

    public void setOvers(Integer overs) {
        this.overs = overs;
    }

    public void setRuns(Integer runs) {
        this.runs = runs;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setTarget(Integer target) {
        this.target = target;
    }

    public void setWickets(Integer wickets) {
        this.wickets = wickets;
    }

    public void setBattingTeam(Team battingTeam) {
        this.battingTeam = battingTeam;
    }

    public void setBowlingTeam(Team bowlingTeam) {
        this.bowlingTeam = bowlingTeam;
    }

    public void setMatch(Match match) {
        this.match = match;
    }
}