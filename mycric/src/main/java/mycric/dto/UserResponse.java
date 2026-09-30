package mycric.dto;

public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;
    private Boolean enabled;

    public UserResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public UserResponse(
            Long id,
            String name,
            String email,
            String role,
            String status,
            Boolean enabled,
            String joinedDate,
            String lastActive,
            Integer tournaments) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
        this.enabled = enabled;
    }
}
// package mycric.dto;

// public class UserResponse {

// private Long id;
// private String name;
// private String email;
// private String role;
// private String status;
// private Boolean enabled;
// private String joinedDate;
// private String lastActive;
// private Integer tournaments;

// public UserResponse() {
// }

// public UserResponse(
// Long id,
// String name,
// String email,
// String role,
// String status,
// Boolean enabled,
// String joinedDate,
// String lastActive,
// Integer tournaments
// ) {
// this.id = id;
// this.name = name;
// this.email = email;
// this.role = role;
// this.status = status;
// this.enabled = enabled;
// this.joinedDate = joinedDate;
// this.lastActive = lastActive;
// this.tournaments = tournaments;
// }

// public Long getId() {
// return id;
// }

// public void setId(Long id) {
// this.id = id;
// }

// public String getName() {
// return name;
// }

// public void setName(String name) {
// this.name = name;
// }

// public String getEmail() {
// return email;
// }

// public void setEmail(String email) {
// this.email = email;
// }

// public String getRole() {
// return role;
// }

// public void setRole(String role) {
// this.role = role;
// }

// public String getStatus() {
// return status;
// }

// public void setStatus(String status) {
// this.status = status;
// }

// public Boolean getEnabled() {
// return enabled;
// }

// public void setEnabled(Boolean enabled) {
// this.enabled = enabled;
// }

// public String getJoinedDate() {
// return joinedDate;
// }

// public void setJoinedDate(String joinedDate) {
// this.joinedDate = joinedDate;
// }

// public String getLastActive() {
// return lastActive;
// }

// public void setLastActive(String lastActive) {
// this.lastActive = lastActive;
// }

// public Integer getTournaments() {
// return tournaments;
// }

// public void setTournaments(Integer tournaments) {
// this.tournaments = tournaments;
// }
// }
