package mycric.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teams")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Team {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name="team_name", nullable=false, length=255) private String teamName;
    @Column(name="short_name", length=50) private String shortName;
    @Column(name="captain", length=255) private String captain;
    @Column(name="coach", length=255) private String coach;
    @Column(name="city", length=255) private String city;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="tournament_id") @JsonIgnore private Tournament tournament;

    @OneToMany(mappedBy="team", cascade=CascadeType.ALL, orphanRemoval=true)
    @JsonIgnore private List<Player> players = new ArrayList<>();

    public Team() {}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public String getTeamName(){return teamName;} public void setTeamName(String v){teamName=v;}
    public String getShortName(){return shortName;} public void setShortName(String v){shortName=v;}
    public String getCaptain(){return captain;} public void setCaptain(String v){captain=v;}
    public String getCoach(){return coach;} public void setCoach(String v){coach=v;}
    public String getCity(){return city;} public void setCity(String v){city=v;}
    public Tournament getTournament(){return tournament;} public void setTournament(Tournament v){tournament=v;}
    public List<Player> getPlayers(){return players;} public void setPlayers(List<Player> v){players=v;}
}
