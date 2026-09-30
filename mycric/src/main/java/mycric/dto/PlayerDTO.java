package mycric.dto;

public class PlayerDTO {

    private Long id;
    private String playerName;
    private int age;
    private String role;
    private String battingStyle;
    private String bowlingStyle;
    private String nationality;
    private Long teamId;
    private String teamName;

    public PlayerDTO() {
    }

    public PlayerDTO(Long id, String playerName, int age, String role,
                     String battingStyle, String bowlingStyle,
                     String nationality, Long teamId, String teamName) {
        this.id = id;
        this.playerName = playerName;
        this.age = age;
        this.role = role;
        this.battingStyle = battingStyle;
        this.bowlingStyle = bowlingStyle;
        this.nationality = nationality;
        this.teamId = teamId;
        this.teamName = teamName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getBattingStyle() {
        return battingStyle;
    }

    public void setBattingStyle(String battingStyle) {
        this.battingStyle = battingStyle;
    }

    public String getBowlingStyle() {
        return bowlingStyle;
    }

    public void setBowlingStyle(String bowlingStyle) {
        this.bowlingStyle = bowlingStyle;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }
}