package com.bill.backend.controller;

import com.bill.backend.model.User;
import com.bill.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://127.0.0.1:5500") // allow frontend requests
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // ===================== SIGNUP =====================
    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@RequestBody User user) {
        Map<String, String> response = new HashMap<>();

        if (userRepository.existsByUsername(user.getUsername())) {
            response.put("error", "Username already exists");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        if (userRepository.existsByEmail(user.getEmail())) {
            response.put("error", "Email already registered");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        if (userRepository.existsByEspMac(user.getEspMac())) {
            response.put("error", "ESP MAC address already in use");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        userRepository.save(user);
        response.put("message", "Signup successful");
        response.put("espMac", user.getEspMac());
        return ResponseEntity.ok(response);
    }

    // ===================== LOGIN =====================
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody User loginRequest) {
        Map<String, String> response = new HashMap<>();

        try {
            Optional<User> userOpt = userRepository.findByUsername(loginRequest.getUsername());

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getPassword() != null && user.getPassword().equals(loginRequest.getPassword())) {
                    response.put("message", "Login successful");
                    response.put("username", user.getUsername());
                    response.put("espMac", user.getEspMac());
                    return ResponseEntity.ok(response);
                } else {
                    response.put("error", "Invalid username or password");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
                }
            } else {
                response.put("error", "User not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ===================== GET USER PROFILE =====================
    @GetMapping("/profile/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isPresent()) {
                return ResponseEntity.ok(userOpt.get());
            } else {
                Map<String, String> response = new HashMap<>();
                response.put("error", "User not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> response = new HashMap<>();
            response.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
