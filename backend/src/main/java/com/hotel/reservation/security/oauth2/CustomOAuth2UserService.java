package com.hotel.reservation.security.oauth2;

import com.hotel.reservation.model.User;
import com.hotel.reservation.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId(); // "google"
        String providerId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        String avatar = oAuth2User.getAttribute("picture");

        User user = userRepository.findByProviderAndProviderId(provider, providerId)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setProvider(provider);
                    newUser.setProviderId(providerId);
                    newUser.setEmail(email);
                    newUser.setFirstName(firstName);
                    newUser.setLastName(lastName);
                    newUser.setAvatar(avatar);
                    newUser.setEnabled(true);
                    newUser.getRoles().add(User.Role.GUEST);
                    return newUser;
                });

        // Update user info if changed
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setAvatar(avatar);
        user.setProvider(provider);
        user.setProviderId(providerId);
        user.setEnabled(true);

        userRepository.save(user);

        // Return a principal for Spring Security
        return new org.springframework.security.oauth2.core.user.DefaultOAuth2User(
                oAuth2User.getAuthorities(),
                oAuth2User.getAttributes(),
                "sub"
        );
    }
}
