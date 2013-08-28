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

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import org.slf4j.Logger;

import dk.dma.arcticweb.service.ShipService;
import dk.dma.embryo.domain.Ship2;
import dk.dma.embryo.rest.json.Ship;

/**
 * 
 * @author Jesper Tejlgaard
 */
@Path("/ship")
public class ShipRestService {

    @Inject
    private ShipService shipService;

    @Inject
    private Logger logger;

    public ShipRestService() {
    }

    @GET
    @Path("/yourship")
    @Produces("application/json")
    public Ship getYourShip() {
        logger.debug("getYourShip()");

        Ship2 ship = shipService.getYourShip();
        
        Ship result = null;
        if(ship != null){
            result = ship.toJsonModel();
        }
        
        logger.debug("getYourShip(): {}", result);
        
        return result;
    }

//    @GET
//    @Path("/{maritimeId}")
//    @Consumes("application/json")
//    public void get(@PathParam("maritimeId") String maritimeId) {
//        logger.debug("get({})", maritimeId);
//
//        GreenPosReport toBeSaved = GreenPosReport.from(report);
//
//        shipService.get
//        // String result = "Product created : " + product;
//        // return Response.status(201).entity(result).build();
//        logger.debug("save() - done", report);
//    }

}
