
package mycric.dto;

public class TournamentResponse {

    private Long id;
    private String tournamentName;
    private String location;
    private String status;

    public TournamentResponse() {
    }

    public TournamentResponse(Long id, String tournamentName,
                              String location, String status) {
        this.id = id;
        this.tournamentName = tournamentName;
        this.location = location;
        this.status = status;
    }

    // Generate getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTournamentName() {
        return tournamentName;
    }

    public void setTournamentName(String tournamentName) {
        this.tournamentName = tournamentName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}