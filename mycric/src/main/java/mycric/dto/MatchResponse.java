package mycric.dto;

public class MatchResponse {

    private Long id;
    private String team1;
    private String team2;
    private String venue;
    private String status;

    public MatchResponse() {
    }

    public MatchResponse(Long id, String team1, String team2, String venue, String status) {
        this.id = id;
        this.team1 = team1;
        this.team2 = team2;
        this.venue = venue;
        this.status = status;
    }

    // Generate getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTeam1() {
        return team1;
    }

    public void setTeam1(String team1) {
        this.team1 = team1;
    }

    public String getTeam2() {
        return team2;
    }

    public void setTeam2(String team2) {
        this.team2 = team2;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}