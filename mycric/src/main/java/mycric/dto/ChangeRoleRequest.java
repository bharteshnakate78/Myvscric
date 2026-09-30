package mycric.dto;

import mycric.entity.Role;

public class ChangeRoleRequest {

    private Role role;

    public ChangeRoleRequest() {
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}