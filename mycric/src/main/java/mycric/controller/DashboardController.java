package mycric.controller;

import mycric.dto.DashboardDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import mycric.service.DashboardService;

// @RestController
// @RequestMapping("/api/dashboard")
// @CrossOrigin("*")
// public class DashboardController {

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin("*")
public class DashboardController {
    @Autowired
    private DashboardService dashboardService;

    @GetMapping
    public DashboardDTO dashboard() {
        return dashboardService.getDashboardData();
    }
}