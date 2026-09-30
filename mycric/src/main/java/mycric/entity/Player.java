package mycric.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity @Table(name="players")
@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
public class Player {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="player_name", nullable=false) private String playerName;
    private int age;
    private String role;
    private String battingStyle;
    private String bowlingStyle;
    private String nationality;
    private String city;
    private int runs;
    private int wickets;
    private int matches;
    private String status = "ACTIVE";

    @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="team_id") private Team team;

    public Player() {}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public String getPlayerName(){return playerName;} public void setPlayerName(String v){playerName=v;}
    public int getAge(){return age;} public void setAge(int v){age=v;}
    public String getRole(){return role;} public void setRole(String v){role=v;}
    public String getBattingStyle(){return battingStyle;} public void setBattingStyle(String v){battingStyle=v;}
    public String getBowlingStyle(){return bowlingStyle;} public void setBowlingStyle(String v){bowlingStyle=v;}
    public String getNationality(){return nationality;} public void setNationality(String v){nationality=v;}
    public String getCity(){return city;} public void setCity(String v){city=v;}
    public int getRuns(){return runs;} public void setRuns(int v){runs=v;}
    public int getWickets(){return wickets;} public void setWickets(int v){wickets=v;}
    public int getMatches(){return matches;} public void setMatches(int v){matches=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public Team getTeam(){return team;} public void setTeam(Team v){team=v;}
}
