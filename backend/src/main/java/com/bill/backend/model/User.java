package com.bill.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-increment primary key
    @Column(name = "id")  // ✅ Ensure column name matches DB
    private Long id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password", nullable = false, length = 100)
    private String password;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "esp_mac", nullable = false, unique = true, length = 100)
    private String espMac;

    @Column(name = "fullname", length = 100)
    private String fullname;

    // === Getters and Setters ===
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getEspMac() { return espMac; }
    public void setEspMac(String espMac) { this.espMac = espMac; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }
}
