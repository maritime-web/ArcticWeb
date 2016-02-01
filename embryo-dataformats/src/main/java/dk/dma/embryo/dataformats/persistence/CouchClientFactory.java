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

package dk.dma.embryo.dataformats.persistence;

import dk.dma.embryo.common.configuration.Property;
import org.apache.http.HttpHost;
import org.apache.http.client.fluent.Executor;

import javax.annotation.PostConstruct;
import javax.ejb.AccessTimeout;
import javax.ejb.Singleton;
import javax.enterprise.inject.Produces;
import javax.inject.Inject;

/**
 * Created by Steen on 18-01-2016.
 *
 */
@SuppressWarnings("unused")
@Singleton
@AccessTimeout(15000)
public class CouchClientFactory {
    private String forecastDb;
    private String host;
    private int port;
    private String user;
    private String password;
    private String designDocumentResourceUrl;
    private String designDocumentId;

    //Required for EJB
    protected CouchClientFactory() {
    }

    @Inject
    public CouchClientFactory(@Property("embryo.couchDb.forecast.db") String forecastDb,
                              @Property("embryo.couchDb.host") String host,
                              @Property("embryo.couchDb.port") int port,
                              @Property("embryo.couchDb.user") String user,
                              @Property("embryo.couchDb.password") String password,
                              @Property("embryo.couchDb.forecast.design.resource.url") String designDocumentResourceUrl,
                              @Property("embryo.couchDb.forecast.design.document.id") String designDocumentId
    ) {
        this.forecastDb = forecastDb;
        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.designDocumentResourceUrl = designDocumentResourceUrl;
        this.designDocumentId = designDocumentId;
    }


    @PostConstruct
    public void initialize() {
        createHttpCouchClient().initialize();
    }

    @Produces
    @CouchDatabase(databaseName = "forecast")
    public HttpCouchClient createHttpCouchClient() {
        CouchDbConfig config = new CouchDbConfig(forecastDb, designDocumentResourceUrl, designDocumentId, host, port, user, password);
        Executor executor = createExecutor(config);
        return new HttpCouchClient(executor, config);
    }

    private Executor createExecutor(CouchDbConfig config) {
        HttpHost host = new HttpHost(config.getHost(), config.getPort());
        return Executor.newInstance()
                .auth(host, config.getUser(), config.getPassword())
                .authPreemptive(host);
    }


}
