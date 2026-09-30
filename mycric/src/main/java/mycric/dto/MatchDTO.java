package mycric.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class MatchDTO {

    private Long id;
    private Long tournamentId;
    private Long team1Id;
    private Long team2Id;

    private String team1Name;
    private String team2Name;

    private String venue;

    private LocalDate matchDate;
    private LocalTime matchTime;

    private String matchType;     // T20, ODI, Test
    private String status;        // UPCOMING, LIVE, COMPLETED

    public MatchDTO() {
    }

    public MatchDTO(Long id, Long tournamentId, Long team1Id, Long team2Id,
                    String team1Name, String team2Name,
                    String venue, LocalDate matchDate,
                    LocalTime matchTime, String matchType,
                    String status) {

        this.id = id;
        this.tournamentId = tournamentId;
        this.team1Id = team1Id;
        this.team2Id = team2Id;
        this.team1Name = team1Name;
        this.team2Name = team2Name;
        this.venue = venue;
        this.matchDate = matchDate;
        this.matchTime = matchTime;
        this.matchType = matchType;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Long tournamentId) {
        this.tournamentId = tournamentId;
    }

    public Long getTeam1Id() {
        return team1Id;
    }

    public void setTeam1Id(Long team1Id) {
        this.team1Id = team1Id;
    }

    public Long getTeam2Id() {
        return team2Id;
    }

    public void setTeam2Id(Long team2Id) {
        this.team2Id = team2Id;
    }

    public String getTeam1Name() {
        return team1Name;
    }

    public void setTeam1Name(String team1Name) {
        this.team1Name = team1Name;
    }

    public String getTeam2Name() {
        return team2Name;
    }

    public void setTeam2Name(String team2Name) {
        this.team2Name = team2Name;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public LocalDate getMatchDate() {
        return matchDate;
    }

    public void setMatchDate(LocalDate matchDate) {
        this.matchDate = matchDate;
    }

    public LocalTime getMatchTime() {
        return matchTime;
    }

    public void setMatchTime(LocalTime matchTime) {
        this.matchTime = matchTime;
    }

    public String getMatchType() {
        return matchType;
    }

    public void setMatchType(String matchType) {
        this.matchType = matchType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}