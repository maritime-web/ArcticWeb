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
package dk.dma.embryo.vessel.model;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

import javax.persistence.Column;
import javax.persistence.Embeddable;

/**
 * @author Jesper Tejlgaard
 */
@Embeddable
public class AisData implements Serializable{
    
    private static final long serialVersionUID = -1013693596958206861L;

    @Column(nullable = true, length = 128)
    private String name;
    
    @Column(nullable = true, length = 32)
    private String callsign;

    @Column(nullable = true)
    private Long imoNo;

    // //////////////////////////////////////////////////////////////////////
    // Utility methods
    // //////////////////////////////////////////////////////////////////////
    Map<String, Object> toJsonModel(){
        Map<String, Object> map = new HashMap<>();
        
        map.put("name", name);
        map.put("callsign", callsign);
        map.put("imoNo", imoNo);
        
        return map;
    }
    
    // //////////////////////////////////////////////////////////////////////
    // Property methods
    // //////////////////////////////////////////////////////////////////////
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCallsign() {
        return callsign;
    }

    public void setCallsign(String callsign) {
        this.callsign = callsign;
    }

    public Long getImoNo() {
        return imoNo;
    }

    public void setImoNo(Long imoNo) {
        this.imoNo = imoNo;
    }
}
