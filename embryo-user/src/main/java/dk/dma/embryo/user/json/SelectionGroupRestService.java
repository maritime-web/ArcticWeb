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
package dk.dma.embryo.user.json;

import java.util.ArrayList;
import java.util.List;

import javax.ejb.FinderException;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Request;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.jboss.resteasy.annotations.GZIP;
import org.jboss.resteasy.annotations.cache.NoCache;
import org.slf4j.Logger;

import dk.dma.embryo.user.model.SecuredUser;
import dk.dma.embryo.user.model.SelectionGroup;
import dk.dma.embryo.user.security.Subject;
import dk.dma.embryo.user.service.UserService;

@Path("/selectiongroup")
public class SelectionGroupRestService extends AbstractRestService {

    @Inject
    private Logger logger;

    @Inject
    private Subject subject;

    @Inject
    private UserService userService;

    @GET
    @GZIP
    @Path("/list")
    @Produces("application/json")
    @NoCache
    public Response list(@Context Request request) {
        
        SecuredUser securedUser = this.subject.getUser();
        logger.info("Calling list all Selection Groups for logged on user -> " + securedUser.getUserName());

        List<SelectionGroupDTO> result = new ArrayList<SelectionGroupDTO>();

        for (SelectionGroup selectionGroup : securedUser.getSelectionGroups()) {

            SelectionGroupDTO groupDTO = new SelectionGroupDTO();
            groupDTO.setId(selectionGroup.getId());
            groupDTO.setActive(selectionGroup.getActive());
            groupDTO.setName(selectionGroup.getName());
            groupDTO.setPolygonsAsJson(selectionGroup.getPolygonsAsJson());

            result.add(groupDTO);
        }
        
        return super.getResponse(request, result, 1);
    }

    @POST
    @Path("/update")
    @Consumes("application/json")
    public void update(List<SelectionGroupDTO> selectionGroupDTOs) {


        if(selectionGroupDTOs != null) {

            List<SelectionGroup> selectionGroups = new ArrayList<SelectionGroup>();
            for (SelectionGroupDTO selectionGroupDTO : selectionGroupDTOs) {

                SelectionGroup selectionGroup = new SelectionGroup(
                        selectionGroupDTO.name, selectionGroupDTO.polygonsAsJson, selectionGroupDTO.active);

                selectionGroups.add(selectionGroup);
            }

            try {
                this.userService.updateSelectionGroups(selectionGroups, this.subject.getUser().getUserName());
            } catch (FinderException e) {
                throw new WebApplicationException(Response.status(Status.NOT_FOUND).entity(e.getMessage()).build());
            }
        }
    }

    public static class SelectionGroupDTO {

        private Long id;
        private String name;
        private Boolean active;
        private String polygonsAsJson;

        public Long getId() {
            return id;
        }
        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }
        public void setName(String name) {
            this.name = name;
        }

        public Boolean getActive() {
            return active;
        }
        public void setActive(Boolean active) {
            this.active = active;
        }

        public String getPolygonsAsJson() {
            return polygonsAsJson;
        }
        public void setPolygonsAsJson(String polygonsAsJson) {
            this.polygonsAsJson = polygonsAsJson;
        }
    }
}
