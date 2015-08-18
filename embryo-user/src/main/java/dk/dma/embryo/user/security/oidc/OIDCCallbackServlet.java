/* Copyright (c) 2011 Danish Maritime Authority.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package dk.dma.embryo.user.security.oidc;

import dk.dma.embryo.common.log.EmbryoLogService;
import dk.dma.embryo.user.model.SecuredUser;
import dk.dma.embryo.user.persistence.RealmDao;
import dk.dma.embryo.user.security.Subject;
import dk.dma.embryo.user.service.UserService;
import net.maritimecloud.idreg.client.AccessTokenData;
import net.maritimecloud.idreg.client.AuthErrorException;
import net.maritimecloud.idreg.client.OIDCUtils;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.slf4j.Logger;

import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.logging.Level;

/**
 * Called by the Keycloak OpenID Connect service when the user has attempted to log in
 */
@WebServlet("/oidc-login")
public class OIDCCallbackServlet extends HttpServlet {

    @Inject
    Logger logger;

    @Inject
    OIDCClientService oidcClientService;

    @Inject
    private Subject subject;

    @Inject
    private transient RealmDao realmDao;

    @Inject
    private transient UserService userService;

    @Inject
    private EmbryoLogService embryoLogService;

    /**
     * Handle the OpenID Connect callback request
     *
     * @param request the servlet request
     * @param response the servlet response
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // Make sure the user is logged out
        if (subject.isLoggedIn()) {
            subject.logout();
        }

        logger.info("OpenID Connect callback called");
        try {
            OIDCUtils.nocache(response);
            String callbackUrl = OIDCUtils.getUrl(request, "/oidc-callback");
            AccessTokenData accessTokenData = oidcClientService.getOidcClient().handleAuthServerCallback(request, callbackUrl);
            logger.info("OpenID Connect authentication success: " + accessTokenData);

            // Check if the user needs to be created
            checkCreateUser(accessTokenData);

            // Log the user in
            login(accessTokenData);

        } catch (AuthErrorException e) {
            logger.info("OpenID Connect authentication error", e);
        }

        response.sendRedirect("/content.html#/checkLogin");
    }

    private void checkCreateUser(AccessTokenData accessTokenData) {
        SecuredUser user = realmDao.findByUsername(accessTokenData.getUserName());
        if (user == null) {
            userService.create(
                    accessTokenData.getUserName(),
                    UUID.randomUUID().toString(),
                    (long)(Math.random() * 9999999),
                    accessTokenData.getEmail(),
                    getRole(accessTokenData),
                    null
            );
        }
    }

    private String getRole(AccessTokenData accessTokenData) {
        if (accessTokenData.getRealmRoles() != null) {
            if (accessTokenData.getRealmRoles().contains("Administration")) {
                return "Administration";
            } else if (accessTokenData.getRealmRoles().contains("Reporting")) {
                return "Reporting";
            } else if (accessTokenData.getRealmRoles().contains("Shore")) {
                return "Shore";
            }
        }
        return "Sailor";
    }

    /**
     * Logs in the given user
     * @param accessTokenData the access token data
     */
    private void login(AccessTokenData accessTokenData) {

        UsernamePasswordToken token = new OIDCAuthenticationToken(accessTokenData.getUserName());
        SecurityUtils.getSubject().login(token);
        SecuredUser user = realmDao.findByUsername(accessTokenData.getUserName());
        logger.info("Logged in user " + user.getUserName());
        embryoLogService.info("User " + user.getUserName() + " logged in");
    }
}
