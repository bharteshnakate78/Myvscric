package mycric.dto;

public class ScoreDTO {

    private Long id;
    private Long matchId;

    private int runs;
    private int wickets;
    private double overs;

    private String striker;
    private String nonStriker;
    private String bowler;

    private int target;
    private String result;

    public ScoreDTO() {
    }

    public ScoreDTO(Long id, Long matchId, int runs, int wickets,
                    double overs, String striker,
                    String nonStriker, String bowler,
                    int target, String result) {

        this.id = id;
        this.matchId = matchId;
        this.runs = runs;
        this.wickets = wickets;
        this.overs = overs;
        this.striker = striker;
        this.nonStriker = nonStriker;
        this.bowler = bowler;
        this.target = target;
        this.result = result;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public int getWickets() {
        return wickets;
    }

    public void setWickets(int wickets) {
        this.wickets = wickets;
    }

    public double getOvers() {
        return overs;
    }

    public void setOvers(double overs) {
        this.overs = overs;
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

    public int getTarget() {
        return target;
    }

    public void setTarget(int target) {
        this.target = target;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }
}