package mycric.dto;

public class DashboardDTO {

    private long totalUsers;
    private long totalTournaments;
    private long totalTeams;
    private long totalPlayers;
    private long totalMatches;
    private long liveMatches;
    private long completedMatches;
    private long upcomingMatches;

    public DashboardDTO() {
    }

    public DashboardDTO(long totalUsers,
                        long totalTournaments,
                        long totalTeams,
                        long totalPlayers,
                        long totalMatches,
                        long liveMatches,
                        long completedMatches,
                        long upcomingMatches) {

        this.totalUsers = totalUsers;
        this.totalTournaments = totalTournaments;
        this.totalTeams = totalTeams;
        this.totalPlayers = totalPlayers;
        this.totalMatches = totalMatches;
        this.liveMatches = liveMatches;
        this.completedMatches = completedMatches;
        this.upcomingMatches = upcomingMatches;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalTournaments() {
        return totalTournaments;
    }

    public void setTotalTournaments(long totalTournaments) {
        this.totalTournaments = totalTournaments;
    }

    public long getTotalTeams() {
        return totalTeams;
    }

    public void setTotalTeams(long totalTeams) {
        this.totalTeams = totalTeams;
    }

    public long getTotalPlayers() {
        return totalPlayers;
    }

    public void setTotalPlayers(long totalPlayers) {
        this.totalPlayers = totalPlayers;
    }

    public long getTotalMatches() {
        return totalMatches;
    }

    public void setTotalMatches(long totalMatches) {
        this.totalMatches = totalMatches;
    }

    public long getLiveMatches() {
        return liveMatches;
    }

    public void setLiveMatches(long liveMatches) {
        this.liveMatches = liveMatches;
    }

    public long getCompletedMatches() {
        return completedMatches;
    }

    public void setCompletedMatches(long completedMatches) {
        this.completedMatches = completedMatches;
    }

    public long getUpcomingMatches() {
        return upcomingMatches;
    }

    public void setUpcomingMatches(long upcomingMatches) {
        this.upcomingMatches = upcomingMatches;
    }
}