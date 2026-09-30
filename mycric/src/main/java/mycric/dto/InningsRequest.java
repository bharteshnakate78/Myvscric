package mycric.dto;

public class InningsRequest {

    private Integer inningsNumber;
    private Long battingTeamId;
    private Long bowlingTeamId;
    private Long matchId;
    private Integer target;

    public InningsRequest() {
    }

    public Integer getInningsNumber() {
        return inningsNumber;
    }

    public void setInningsNumber(Integer inningsNumber) {
        this.inningsNumber = inningsNumber;
    }

    public Long getBattingTeamId() {
        return battingTeamId;
    }

    public void setBattingTeamId(Long battingTeamId) {
        this.battingTeamId = battingTeamId;
    }

    public Long getBowlingTeamId() {
        return bowlingTeamId;
    }

    public void setBowlingTeamId(Long bowlingTeamId) {
        this.bowlingTeamId = bowlingTeamId;
    }

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }

    public Integer getTarget() {
        return target;
    }

    public void setTarget(Integer target) {
        this.target = target;
    }
}