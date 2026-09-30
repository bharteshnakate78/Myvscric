package mycric.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "scores")
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "match_id")
    private Match match;

    private int runs;

    private int wickets;

    private float overs;

    private String striker;

    private String nonStriker;

    private String bowler;

    public Score() {
    }

    public Long getId() {
        return id;
    }

    public Match getMatch() {
        return match;
    }

    public int getRuns() {
        return runs;
    }

    public int getWickets() {
        return wickets;
    }

    public float getOvers() {
        return overs;
    }

    public String getStriker() {
        return striker;
    }

    public String getNonStriker() {
        return nonStriker;
    }

    public String getBowler() {
        return bowler;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setMatch(Match match) {
        this.match = match;
    }

    public void setRuns(int runs) {
        this.runs = runs;
    }

    public void setWickets(int wickets) {
        this.wickets = wickets;
    }

    public void setOvers(float overs) {
        this.overs = overs;
    }

    public void setStriker(String striker) {
        this.striker = striker;
    }

    public void setNonStriker(String nonStriker) {
        this.nonStriker = nonStriker;
    }

    public void setBowler(String bowler) {
        this.bowler = bowler;
    }
}