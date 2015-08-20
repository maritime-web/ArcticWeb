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

import dk.dma.embryo.common.configuration.Property;
import net.maritimecloud.idreg.client.OIDCClient;
import org.slf4j.Logger;

import javax.annotation.PostConstruct;
import javax.ejb.Singleton;
import javax.ejb.Startup;
import javax.inject.Inject;
import java.io.FileReader;
import java.io.Reader;

/**
 * Manages the OpenID Connect client
 */
@Singleton
@Startup

public class OIDCClientService {

    @Inject
    @Property(value = "embryo.keycloak.json", substituteSystemProperties = true)
    private String keycloakJsonFile;

    @Inject
    Logger logger;

    private OIDCClient oidcClient;

    /**
     * Called when the service is initialized
     */
    @PostConstruct
    public void init() {
        try (Reader configFile = new FileReader(keycloakJsonFile)){

            oidcClient = OIDCClient.newBuilder()
                .configuration(configFile)
                .build();

            logger.info("Instantiated OpenID Connect client from " + keycloakJsonFile);

        } catch (Exception e) {
            logger.error("Error instantiating OpenID Connect client");
        }
    }

    /** Returns the OpenID Connect client if defined, and null otherwise */
    public OIDCClient getOidcClient() {
        return oidcClient;
    }
}
