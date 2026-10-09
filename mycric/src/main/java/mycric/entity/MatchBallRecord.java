package mycric.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "match_ball_records")
public class MatchBallRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false)
    private Long matchId;

    @Column(name = "innings_number", nullable = false)
    private Integer inningsNumber;

    @Column(name = "striker_name")
    private String strikerName;

    @Column(name = "non_striker_name")
    private String nonStrikerName;

    @Column(name = "bowler_name")
    private String bowlerName;

    @Column(name = "batting_team_id")
    private Long battingTeamId;

    @Column(name = "bowling_team_id")
    private Long bowlingTeamId;

    @Column(name = "batsman_runs", nullable = false)
    private Integer batsmanRuns = 0;

    @Column(nullable = false)
    private boolean wicket;

    @Column(name = "wicket_type")
    private String wicketType;

    public MatchBallRecord() {}

    public Long getId() { return id; }
    public Long getMatchId() { return matchId; }
    public void setMatchId(Long value) { this.matchId = value; }
    public Integer getInningsNumber() { return inningsNumber; }
    public void setInningsNumber(Integer value) { this.inningsNumber = value; }
    public String getStrikerName() { return strikerName; }
    public void setStrikerName(String value) { this.strikerName = value; }
    public String getNonStrikerName() { return nonStrikerName; }
    public void setNonStrikerName(String value) { this.nonStrikerName = value; }
    public String getBowlerName() { return bowlerName; }
    public void setBowlerName(String value) { this.bowlerName = value; }
    public Long getBattingTeamId() { return battingTeamId; }
    public void setBattingTeamId(Long value) { this.battingTeamId = value; }
    public Long getBowlingTeamId() { return bowlingTeamId; }
    public void setBowlingTeamId(Long value) { this.bowlingTeamId = value; }
    public Integer getBatsmanRuns() { return batsmanRuns == null ? 0 : batsmanRuns; }
    public void setBatsmanRuns(Integer value) { this.batsmanRuns = value == null ? 0 : value; }
    public boolean isWicket() { return wicket; }
    public void setWicket(boolean value) { this.wicket = value; }
    public String getWicketType() { return wicketType; }
    public void setWicketType(String value) { this.wicketType = value; }
}
