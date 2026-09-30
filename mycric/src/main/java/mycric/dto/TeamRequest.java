package mycric.dto;
public class TeamRequest {
 private String teamName, shortName, captain, coach, city; private Long tournamentId;
 public String getTeamName(){return teamName;} public void setTeamName(String v){teamName=v;}
 public String getShortName(){return shortName;} public void setShortName(String v){shortName=v;}
 public String getCaptain(){return captain;} public void setCaptain(String v){captain=v;}
 public String getCoach(){return coach;} public void setCoach(String v){coach=v;}
 public String getCity(){return city;} public void setCity(String v){city=v;}
 public Long getTournamentId(){return tournamentId;} public void setTournamentId(Long v){tournamentId=v;}
}
