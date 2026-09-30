package mycric.controller;
import mycric.entity.Player; import mycric.entity.Team; import mycric.service.PlayerService; import mycric.repository.PlayerRepository; import mycric.repository.TeamRepository;
import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/players") @CrossOrigin(origins="*") public class PlayerController{
 private final PlayerService service; private final PlayerRepository players; private final TeamRepository teams;
 public PlayerController(PlayerService service,PlayerRepository players,TeamRepository teams){this.service=service;this.players=players;this.teams=teams;}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public Player create(@RequestBody Map<String,Object> r){return service.savePlayer(toEntity(r));}
 @GetMapping public List<Player> all(){return service.getAllPlayers();}
 @GetMapping("/stats") public Map<String,Object> stats(){List<Player> p=players.findAll(); return Map.of("players",p.size(),"runs",p.stream().mapToInt(Player::getRuns).sum(),"wickets",p.stream().mapToInt(Player::getWickets).sum(),"active",p.stream().filter(x->!"INACTIVE".equalsIgnoreCase(x.getStatus())).count());}
 @GetMapping("/teams") public List<Team> teams(){return teams.findAll();}
 @GetMapping("/team/{id}") public List<Player> byTeam(@PathVariable Long id){return service.getPlayersByTeam(id);}
 @GetMapping("/{id}") public Player byId(@PathVariable Long id){return service.getPlayerById(id);}
 @PutMapping("/{id}") public Player update(@PathVariable Long id,@RequestBody Map<String,Object> r){return service.updatePlayer(id,toEntity(r));}
 @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){service.deletePlayer(id);return ResponseEntity.noContent().build();}
 private Player toEntity(Map<String,Object> r){Player p=new Player(); Object name=r.get("name"); if(name==null)name=r.get("playerName"); p.setPlayerName(name==null?null:name.toString()); p.setRole(str(r,"role")); p.setBattingStyle(str(r,"battingStyle")); p.setBowlingStyle(str(r,"bowlingStyle")); p.setNationality(str(r,"nationality")); p.setCity(str(r,"city")); p.setStatus(str(r,"status")==null?"ACTIVE":str(r,"status")); p.setAge(intVal(r,"age")); p.setRuns(intVal(r,"runs")); p.setWickets(intVal(r,"wickets")); p.setMatches(intVal(r,"matches")); Object tid=r.get("teamId"); if(tid==null)tid=r.get("team"); if(tid!=null){ try { Long id=Long.valueOf(tid.toString()); p.setTeam(teams.findById(id).orElseThrow(()->new IllegalArgumentException("Team not found: "+id))); } catch(NumberFormatException ex) { String teamName=tid.toString().trim(); p.setTeam(teams.findByTeamNameIgnoreCase(teamName).orElseThrow(()->new IllegalArgumentException("Team not found: "+teamName))); } } return p;}
 private String str(Map<String,Object> r,String k){Object v=r.get(k);return v==null?null:v.toString();} private int intVal(Map<String,Object> r,String k){Object v=r.get(k);if(v==null)return 0;try{return Integer.parseInt(v.toString());}catch(Exception e){return 0;}}
}
