package mycric.dto;
public class MatchRequest {
 private String name; private Long tournamentId, teamAId, teamBId; private String matchDate, time, venue, matchType, status, result, toss; private Integer overs, team1Score, team2Score;
 public String getName(){return name;} public void setName(String v){name=v;}
 public Long getTournamentId(){return tournamentId;} public void setTournamentId(Long v){tournamentId=v;}
 public Long getTeamAId(){return teamAId;} public void setTeamAId(Long v){teamAId=v;}
 public Long getTeamBId(){return teamBId;} public void setTeamBId(Long v){teamBId=v;}
 public String getMatchDate(){return matchDate;} public void setMatchDate(String v){matchDate=v;}
 public String getTime(){return time;} public void setTime(String v){time=v;}
 public String getVenue(){return venue;} public void setVenue(String v){venue=v;}
 public String getMatchType(){return matchType;} public void setMatchType(String v){matchType=v;}
 public Integer getOvers(){return overs;} public void setOvers(Integer v){overs=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;}
 public Integer getTeam1Score(){return team1Score;} public void setTeam1Score(Integer v){team1Score=v;}
 public Integer getTeam2Score(){return team2Score;} public void setTeam2Score(Integer v){team2Score=v;}
 public String getResult(){return result;} public void setResult(String v){result=v;}
 public String getToss(){return toss;} public void setToss(String v){toss=v;}
}
