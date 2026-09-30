package mycric.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity @Table(name="matches")
@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
public class Match {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    private String name;
    @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="tournament_id", nullable=false) private Tournament tournament;
    @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="team_a_id", nullable=false) private Team teamA;
    @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="team_b_id", nullable=false) private Team teamB;
    private String venue;
    @Column(nullable=false) private String matchDate;
    private String time;
    private String matchType;
    private Integer overs;
    @Column(nullable=false) private String status="SCHEDULED";
    private Integer team1Score;
    private Integer team2Score;
    private String result;
    private String toss;
    private String winner;

    public Match() {}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public String getName(){return name;} public void setName(String v){name=v;}
    public Tournament getTournament(){return tournament;} public void setTournament(Tournament v){tournament=v;}
    public Team getTeamA(){return teamA;} public void setTeamA(Team v){teamA=v;}
    public Team getTeamB(){return teamB;} public void setTeamB(Team v){teamB=v;}
    public String getVenue(){return venue;} public void setVenue(String v){venue=v;}
    public String getMatchDate(){return matchDate;} public void setMatchDate(String v){matchDate=v;}
    public String getTime(){return time;} public void setTime(String v){time=v;}
    public String getMatchType(){return matchType;} public void setMatchType(String v){matchType=v;}
    public Integer getOvers(){return overs;} public void setOvers(Integer v){overs=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public Integer getTeam1Score(){return team1Score;} public void setTeam1Score(Integer v){team1Score=v;}
    public Integer getTeam2Score(){return team2Score;} public void setTeam2Score(Integer v){team2Score=v;}
    public String getResult(){return result;} public void setResult(String v){result=v;}
    public String getToss(){return toss;} public void setToss(String v){toss=v;}
    public String getWinner(){return winner;} public void setWinner(String v){winner=v;}
}
