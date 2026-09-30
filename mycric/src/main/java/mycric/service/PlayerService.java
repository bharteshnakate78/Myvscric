package mycric.service;

import mycric.entity.Player;

import java.util.List;

public interface PlayerService {

    Player savePlayer(Player player);

    List<Player> getAllPlayers();

    Player getPlayerById(Long id);

    List<Player> getPlayersByTeam(Long teamId);

    Player updatePlayer(Long id, Player player);

    void deletePlayer(Long id);
}