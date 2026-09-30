package mycric.dto;

public class PlayerResponse {

    private Long id;
    private String playerName;
    private int age;
    private String role;

    public PlayerResponse() {
    }

    public PlayerResponse(Long id, String playerName, int age, String role) {
        this.id = id;
        this.playerName = playerName;
        this.age = age;
        this.role = role;
    }

    public Long getId() {
        return id;
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
}