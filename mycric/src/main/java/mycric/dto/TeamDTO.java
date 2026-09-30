package mycric.dto;

public class TeamDTO {

    private Long id;
    private String teamName;
    private String captain;
    private String coach;
    private String city;
    private String owner;
    private String homeGround;
    private int totalPlayers;

    public TeamDTO() {
    }

    public TeamDTO(Long id, String teamName, String captain,
                   String coach, String city,
                   String owner, String homeGround,
                   int totalPlayers) {

        this.id = id;
        this.teamName = teamName;
        this.captain = captain;
        this.coach = coach;
        this.city = city;
        this.owner = owner;
        this.homeGround = homeGround;
        this.totalPlayers = totalPlayers;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getCaptain() {
        return captain;
    }

    public void setCaptain(String captain) {
        this.captain = captain;
    }

    public String getCoach() {
        return coach;
    }

    public void setCoach(String coach) {
        this.coach = coach;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getHomeGround() {
        return homeGround;
    }

    public void setHomeGround(String homeGround) {
        this.homeGround = homeGround;
    }

    public int getTotalPlayers() {
        return totalPlayers;
    }

    public void setTotalPlayers(int totalPlayers) {
        this.totalPlayers = totalPlayers;
    }
}