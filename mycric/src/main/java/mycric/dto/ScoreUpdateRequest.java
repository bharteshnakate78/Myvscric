package mycric.dto;

public class ScoreUpdateRequest {

    private Integer runs;
    private Integer wickets;
    private Boolean legalBall;

    public ScoreUpdateRequest() {
    }

    public Integer getRuns() {
        return runs;
    }

    public void setRuns(Integer runs) {
        this.runs = runs;
    }

    public Integer getWickets() {
        return wickets;
    }

    public void setWickets(Integer wickets) {
        this.wickets = wickets;
    }

    public Boolean getLegalBall() {
        return legalBall;
    }

    public void setLegalBall(Boolean legalBall) {
        this.legalBall = legalBall;
    }
}