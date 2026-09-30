package mycric.dto;

import java.time.LocalDate;

public class TournamentDTO {

    private Long id;
    private String tournamentName;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private String format;
    private int totalTeams;
    private String organizer;
    private String status;

    public TournamentDTO() {
    }

    public TournamentDTO(Long id, String tournamentName,
                         String location,
                         LocalDate startDate,
                         LocalDate endDate,
                         String format,
                         int totalTeams,
                         String organizer,
                         String status) {

        this.id = id;
        this.tournamentName = tournamentName;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.format = format;
        this.totalTeams = totalTeams;
        this.organizer = organizer;
        this.status = status;
    }

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

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public int getTotalTeams() {
        return totalTeams;
    }

    public void setTotalTeams(int totalTeams) {
        this.totalTeams = totalTeams;
    }

    public String getOrganizer() {
        return organizer;
    }

    public void setOrganizer(String organizer) {
        this.organizer = organizer;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}