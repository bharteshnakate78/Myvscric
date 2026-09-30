package mycric.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {

    ADMIN,
    ORGANIZER,
    SCORER,
    USER;

    @JsonCreator
    public static Role fromValue(String value) {

        if (value == null || value.trim().isEmpty()) {
            return USER;
        }

        try {
            return Role.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid role: " + value +
                            ". Allowed roles: ADMIN, ORGANIZER, SCORER, USER");
        }
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}