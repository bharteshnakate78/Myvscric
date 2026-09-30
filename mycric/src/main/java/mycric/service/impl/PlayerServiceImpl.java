package mycric.service.impl;
import mycric.entity.Player; import mycric.entity.Team; import mycric.repository.PlayerRepository; import mycric.repository.TeamRepository; import mycric.service.PlayerService;
import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import java.util.List;
@Service @Transactional public class PlayerServiceImpl implements PlayerService {
 private final PlayerRepository players; private final TeamRepository teams;
 public PlayerServiceImpl(PlayerRepository players,TeamRepository teams){this.players=players;this.teams=teams;}
 public Player savePlayer(Player p){validate(p); p.setId(null); resolveTeam(p); return players.save(p);}
 @Transactional(readOnly=true) public List<Player> getAllPlayers(){return players.findAll();}
 @Transactional(readOnly=true) public Player getPlayerById(Long id){return players.findById(id).orElseThrow(()->new RuntimeException("Player not found: "+id));}
 @Transactional(readOnly=true) public List<Player> getPlayersByTeam(Long teamId){return players.findByTeamId(teamId);}
 public Player updatePlayer(Long id,Player input){Player p=getPlayerById(id); validate(input); p.setPlayerName(input.getPlayerName()); p.setAge(input.getAge()); p.setRole(input.getRole()); p.setBattingStyle(input.getBattingStyle()); p.setBowlingStyle(input.getBowlingStyle()); p.setNationality(input.getNationality()); p.setCity(input.getCity()); p.setMatches(input.getMatches()); p.setRuns(input.getRuns()); p.setWickets(input.getWickets()); p.setStatus(input.getStatus()==null?"ACTIVE":input.getStatus().toUpperCase()); if(input.getTeam()!=null) {p.setTeam(input.getTeam().getId()==null?null:teams.findById(input.getTeam().getId()).orElseThrow(()->new RuntimeException("Team not found")));} return players.save(p);}
 public void deletePlayer(Long id){if(!players.existsById(id)) throw new RuntimeException("Player not found: "+id); players.deleteById(id);}
 private void validate(Player p){if(p==null||p.getPlayerName()==null||p.getPlayerName().trim().isEmpty()) throw new IllegalArgumentException("Player name is required"); p.setPlayerName(p.getPlayerName().trim());}
 private void resolveTeam(Player p){if(p.getTeam()!=null&&p.getTeam().getId()!=null)p.setTeam(teams.findById(p.getTeam().getId()).orElseThrow(()->new RuntimeException("Team not found: "+p.getTeam().getId())));}
}
