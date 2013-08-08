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
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;

import org.slf4j.Logger;

import com.google.common.base.Function;
import com.google.common.collect.Lists;

import dk.dma.arcticweb.service.ShipService;
import dk.dma.embryo.domain.Voyage;
import dk.dma.embryo.site.behavior.TypeaheadDatum;

@Path("/voyage")
public class VoyageService {

    @Inject
    private ShipService shipService;

    @Inject
    private Logger logger;

    public VoyageService() {
    }

    @GET
    @Path("/typeahead/{mmsi}")
    @Produces("application/json")
    public List<VoyageDatum> getVoyages(@PathParam("mmsi") Long mmsi) {
        logger.trace("getVoyages({})", mmsi);

        List<Voyage> voyages = shipService.getVoyages(mmsi);

        List<VoyageDatum> transformed = Lists.transform(voyages, new VoyageTransformerFunction());

        logger.debug("getVoyages({}) : {}", mmsi, transformed);
        return transformed;
    }

    public static class VoyageDatum extends TypeaheadDatum {
        private Long id;

        public VoyageDatum(String value, String[] tokens, Long id) {
            super(value, tokens);
            this.id = id;
        }

        public Long getId() {
            return id;
        }
    }

    public static final class VoyageTransformerFunction implements Function<Voyage, VoyageDatum> {
        private String value(final Voyage input) {
            return input.getBerthName() + " - (" + input.getBusinessId() + ")";
        }

        private String[] tokens(final Voyage input) {
            return new String[] { input.getBerthName(), input.getBusinessId() };
        }

        @Override
        public VoyageDatum apply(final Voyage input) {
            return new VoyageDatum(value(input), tokens(input), input.getId());
        }
    }

}