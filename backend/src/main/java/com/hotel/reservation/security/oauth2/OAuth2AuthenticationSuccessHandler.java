package com.hotel.reservation.security.oauth2;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import com.hotel.reservation.security.JwtTokenProvider;
import com.hotel.reservation.model.User;
import com.hotel.reservation.repository.UserRepository;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.frontend.url:http://localhost}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        // Get the provider from the OAuth2AuthenticationToken
        String provider = "google"; // default
        if (authentication instanceof OAuth2AuthenticationToken) {
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            provider = oauthToken.getAuthorizedClientRegistrationId(); // "google" or "okta"
        }

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String providerId = oAuth2User.getAttribute("sub");

        System.out.println("OAuth2 Success Handler - Provider: " + provider + ", ProviderId: " + providerId);

        User user = userRepository.findByProviderAndProviderId(provider, providerId).orElse(null);

        if (user == null) {
            System.err.println("ERROR: User not found for provider=" + provider + ", providerId=" + providerId);
            // Try to find all users to debug
            System.out.println("Total users in database: " + userRepository.count());

            // Debug: Print all users
            userRepository.findAll().forEach(u -> {
                System.out.println("DB User: provider='" + u.getProvider() + "', providerId='" + u.getProviderId() + "', email=" + u.getEmail());
            });
        } else {
            System.out.println("User found: " + user.getEmail() + ", ID: " + user.getId());
        }

        String token = user != null ? jwtTokenProvider.generateTokenFromUserId(user.getId()) : "";

        System.out.println("Generated token length: " + token.length());

        response.sendRedirect(frontendUrl + "/oauth2/callback?token=" + token);
    }
}
