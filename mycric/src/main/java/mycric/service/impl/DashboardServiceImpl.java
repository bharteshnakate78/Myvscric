package mycric.service.impl;

import mycric.dto.DashboardDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import mycric.repository.MatchRepository;
import mycric.repository.PlayerRepository;
import mycric.repository.TeamRepository;
import mycric.repository.TournamentRepository;
import mycric.service.DashboardService;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Override
    public DashboardDTO getDashboardData() {

        DashboardDTO dashboard = new DashboardDTO();

        dashboard.setTotalTournaments(tournamentRepository.count());
        dashboard.setTotalTeams(teamRepository.count());
        dashboard.setTotalPlayers(playerRepository.count());
        dashboard.setTotalMatches(matchRepository.count());
        dashboard.setLiveMatches(matchRepository.findByStatus("LIVE").size());

        return dashboard;
    }
}