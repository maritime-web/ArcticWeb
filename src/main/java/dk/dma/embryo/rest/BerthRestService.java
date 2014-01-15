/* Copyright (c) 2011 Danish Maritime Authority
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library.  If not, see <http://www.gnu.org/licenses/>.
 */
package dk.dma.embryo.rest;

import java.util.List;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;

import org.jboss.resteasy.annotations.GZIP;
import org.jboss.resteasy.annotations.cache.NoCache;
import org.slf4j.Logger;

import com.google.common.base.Function;
import com.google.common.collect.Lists;

import dk.dma.embryo.domain.Berth;
import dk.dma.embryo.rest.json.TypeaheadDatum;
import dk.dma.embryo.service.GeographicService;

/**
 * 
 * @author Jesper Tejlgaard
 */
@Path("/berth")
public class BerthRestService {

    @Inject
    private GeographicService geoService;

    @Inject
    private Logger logger;

    @GET
    @Path("/search")
    @Produces("application/json")
    @GZIP
    @NoCache
    public List<BerthDatum> remote(@QueryParam("QUERY") String query) {
        logger.debug("remoteFetch({})", query);

        List<Berth> berths = null;
        List<BerthDatum> transformed = null;
        
        if(query != null && query.trim().length() > 0){
            berths = geoService.findBerths(query);
        }else{
            berths = geoService.findBerths("");
        }
        
        if(berths != null){
            transformed = Lists.transform(berths, new BerthTransformerFunction());
        }

        logger.debug("berths={}", transformed);
        return transformed;
    }
    
    public static class BerthDatum extends TypeaheadDatum {
        private Double latitude;
        private Double longitude;

        public BerthDatum(String value, String[] tokens, Double latitude, Double longitude) {
            super(value, tokens);
            this.latitude = latitude;
            this.longitude = longitude;
        }

        public Double getLatitude() {
            return latitude;
        }

        public Double getLongitude() {
            return longitude;
        }
    }
    

    public static final class BerthTransformerFunction implements Function<Berth, BerthDatum> {
        private String value(final Berth input) {
            return input.getName() + (input.getAlias() != null ? " (" + input.getAlias() + ")" : "");
        }

        private String[] tokens(final Berth input) {
            if (input.getAlias() != null) {
                return new String[] { input.getName(), input.getAlias() };
            }
            return new String[] { input.getName() };
        }

        @Override
        public BerthDatum apply(final Berth input) {
            return new BerthDatum(value(input), tokens(input), input.getPosition().getLatitude(), input
                    .getPosition().getLongitude());
        }
    }
}
