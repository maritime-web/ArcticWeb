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
package dk.dma.arcticweb.reporting.json;

import java.io.Serializable;

import javax.inject.Inject;
import javax.interceptor.AroundInvoke;
import javax.interceptor.Interceptor;
import javax.interceptor.InvocationContext;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import dk.dma.arcticweb.reporting.model.GreenposSearch;
import dk.dma.arcticweb.reporting.service.GreenPosService;
import dk.dma.embryo.vessel.json.Details;
import dk.dma.embryo.vessel.json.VesselDetails;

@Details
@Interceptor
public class GreenposVesselDetailsAmendment implements Serializable {

    private static final long serialVersionUID = 2883332760355286214L;

    @Inject
    private GreenPosService greenposService;

    Logger logger = LoggerFactory.getLogger(GreenposVesselDetailsAmendment.class);
    
    @AroundInvoke
    public Object amendDetails(InvocationContext invocationContext) throws Exception {
        
        logger.debug("amendDetails");
        
        VesselDetails result = (VesselDetails) invocationContext.proceed();
        GreenposSearch s = new GreenposSearch(null, result.getMmsi(), null, null, null, 0, 1);
        boolean greenpos = greenposService.findReports(s).size() > 0;
        result.getAdditionalInformation().put("greenpos", greenpos);
        return result;
    }
}
