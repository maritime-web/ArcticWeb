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

import net.maritimecloud.idreg.client.OIDCUtils;
import org.slf4j.Logger;

import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Use the Keycloak OpenID Connect service to log the user in
 */
@WebServlet("/oidc-login")
public class OIDCLoginServlet extends HttpServlet {

    @Inject
    Logger logger;

    @Inject
    OIDCClientService oidcClientService;

    /**
     * Handle the OpenID Connect login request
     *
     * @param request the servlet request
     * @param response the servlet response
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

        // Check if the service is enabled
        if (oidcClientService.getOidcClient() == null) {
            logger.warn("The OpenID Connect service is not enabled");
            response.sendRedirect("/");
            return;
        }

        logger.info("OpenID Connect login called");
        OIDCUtils.nocache(response);
        String callbackUrl = OIDCUtils.getUrl(request, "/oidc-callback");
        oidcClientService.getOidcClient().redirectToAuthServer(response, callbackUrl);
    }
}
