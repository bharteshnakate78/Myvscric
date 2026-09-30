package mycric.util;

import mycric.dto.PlayerDTO;
import mycric.dto.TeamDTO;
import mycric.entity.Player;
import mycric.entity.Team;

public class MapperUtil {

    private MapperUtil() {
    }

    public static TeamDTO toTeamDTO(Team team) {

        TeamDTO dto = new TeamDTO();

        dto.setTeamName(team.getTeamName());
        dto.setCaptain(team.getCaptain());
        dto.setCoach(team.getCoach());

        return dto;
    }

    public static PlayerDTO toPlayerDTO(Player player) {

        PlayerDTO dto = new PlayerDTO();

        dto.setPlayerName(player.getPlayerName());
        dto.setAge(player.getAge());
        dto.setRole(player.getRole());

        return dto;
    }
}