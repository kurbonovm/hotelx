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
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String provider = "google";
        String providerId = oAuth2User.getAttribute("sub");
        User user = userRepository.findByProviderAndProviderId(provider, providerId).orElse(null);
        String token = user != null ? jwtTokenProvider.generateTokenFromUserId(user.getId()) : "";
        response.sendRedirect(frontendUrl + "/oauth2/callback?token=" + token);
    }
}
