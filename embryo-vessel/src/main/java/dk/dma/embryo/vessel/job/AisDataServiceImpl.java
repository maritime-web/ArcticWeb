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
package dk.dma.embryo.vessel.job;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ejb.Singleton;
import javax.inject.Inject;

import dk.dma.embryo.common.configuration.Property;
import dk.dma.embryo.vessel.job.MaxSpeedJob.MaxSpeedRecording;
import dk.dma.embryo.vessel.json.client.AisViewServiceNorwegianData;
import dk.dma.enav.model.geometry.CoordinateSystem;
import dk.dma.enav.model.geometry.Position;

@Singleton
public class AisDataServiceImpl implements AisDataService {

    private List<AisViewServiceNorwegianData.Vessel> vesselsInAisCircle = new ArrayList<>();
    private List<AisViewServiceNorwegianData.Vessel> vesselsOnMap = new ArrayList<>();
    private Map<Long, MaxSpeedRecording> maxSpeeds =  new HashMap<>();

    @Inject
    @Property("embryo.aisCircle.default.latitude")
    private double aisCircleLatitude;

    @Inject
    @Property("embryo.aisCircle.default.longitude")
    private double aisCircleLongitude;

    @Inject
    @Property("embryo.aisCircle.default.radius")
    private double aisCircleRadius;

    public boolean isWithinAisCircle(double x, double y) {
        return 
                Position.create(y, x).distanceTo(
                        Position.create(aisCircleLatitude, aisCircleLongitude), 
                        CoordinateSystem.GEODETIC) < aisCircleRadius;
    }

    public List<AisViewServiceNorwegianData.Vessel> getVesselsOnMap() {
        return new ArrayList<>(vesselsOnMap);
    }

    public Map<Long, MaxSpeedRecording> getMaxSpeeds() {
        return new HashMap<>(maxSpeeds);
    }

    public void setVesselsInAisCircle(List<AisViewServiceNorwegianData.Vessel> vesselsInAisCircle) {
        this.vesselsInAisCircle = vesselsInAisCircle;
    }

    public void setVesselsOnMap(List<AisViewServiceNorwegianData.Vessel> vessels) {
        this.vesselsOnMap = vessels;
    }

    public void setMaxSpeeds(Map<Long, MaxSpeedRecording> maxSpeeds) {
        this.maxSpeeds = maxSpeeds;
    }
    public List<AisViewServiceNorwegianData.Vessel> getVesselsInAisCircle() {
        return new ArrayList<>(vesselsInAisCircle);
    }

}
