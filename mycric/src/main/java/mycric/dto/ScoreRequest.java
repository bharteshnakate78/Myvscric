package mycric.dto;

public class ScoreRequest {

    private Long matchId;

    private int runs;

    private boolean wicket;

    private String ballType;

    private String striker;

    private String nonStriker;

    private String bowler;

    private Integer batsmanRuns;

    private String wicketType;

    private String description;

    private Boolean legalBall;

    public ScoreRequest() {
    }

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }

    public int getRuns() {
        return runs;
    }

    public void setRuns(int runs) {
        this.runs = runs;
    }

    public boolean isWicket() {
        return wicket;
    }

    public void setWicket(boolean wicket) {
        this.wicket = wicket;
    }

    public String getBallType() {
        return ballType;
    }

    public void setBallType(String ballType) {
        this.ballType = ballType;
    }

    public String getStriker() {
        return striker;
    }

    public void setStriker(String striker) {
        this.striker = striker;
    }

    public String getNonStriker() {
        return nonStriker;
    }

    public void setNonStriker(String nonStriker) {
        this.nonStriker = nonStriker;
    }

    public String getBowler() {
        return bowler;
    }

    public void setBowler(String bowler) {
        this.bowler = bowler;
    }

    public Integer getBatsmanRuns() {
        return batsmanRuns;
    }

    public void setBatsmanRuns(Integer batsmanRuns) {
        this.batsmanRuns = batsmanRuns;
    }

    public String getWicketType() {
        return wicketType;
    }

    public void setWicketType(String wicketType) {
        this.wicketType = wicketType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getLegalBall() {
        return legalBall;
    }

    public void setLegalBall(Boolean legalBall) {
        this.legalBall = legalBall;
    }
}