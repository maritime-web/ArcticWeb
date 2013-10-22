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
package dk.dma.embryo.domain;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.validation.constraints.NotNull;

import org.apache.commons.lang.builder.ReflectionToStringBuilder;
import org.joda.time.DateTimeZone;

import dk.dma.embryo.rest.json.GreenPos;

/**
 * 
 * @author Jesper Tejlgaard
 */
@Entity
@DiscriminatorValue("PR")
public class GreenPosPositionReport extends GreenPosDMIReport {

    private static final long serialVersionUID = -7205030526506222850L;

    // //////////////////////////////////////////////////////////////////////
    // Entity fields (also see super class)
    // //////////////////////////////////////////////////////////////////////
    @NotNull
    private Double speed;

    @NotNull
    private Integer course;
    
    // //////////////////////////////////////////////////////////////////////
    // Utility methods
    // //////////////////////////////////////////////////////////////////////
    public static GreenPosPositionReport fromJsonModel(GreenPos from) {
        Position pos = new Position(from.getLat(), from.getLon());

        GreenPosPositionReport report = new GreenPosPositionReport(from.getVesselName(), from.getMmsi(),
                from.getCallSign(), from.getVesselMaritimeId(), pos, from.getWeather(), from.getIce(),
                from.getSpeed(), from.getCourse());

        return report;
    }

    @Override
    public GreenPos toJsonModel() {
        GreenPos result = new GreenPos();
        result.setId(getEnavId());
        result.setType(getReportType());
        result.setVesselName(getVesselName());
        result.setVesselMaritimeId(getVesselMaritimeId());
        result.setMmsi(getVesselMmsi());
        result.setCallSign(getVesselCallSign());
        result.setLon(getPosition().getLongitudeAsString());
        result.setLat(getPosition().getLatitudeAsString());
        result.setWeather(getWeather());
        result.setIce(getIceInformation());
        result.setSpeed(getSpeed());
        result.setCourse(getCourse());
        result.setReporter(getReportedBy());
        result.setTs(getTs().toDateTime(DateTimeZone.UTC).getMillis());
        
        return result;
    }

    // //////////////////////////////////////////////////////////////////////
    // Constructors
    // //////////////////////////////////////////////////////////////////////
    public GreenPosPositionReport() {
        super();
    }

    public GreenPosPositionReport(String vesselName, Long vesselMmsi, String vesselCallSign, String vesselMaritimeId,
            String latitude, String longitude, String weather, String iceInformation, Double speed, Integer course) {
        super(vesselName, vesselMmsi, vesselCallSign, vesselMaritimeId, latitude, longitude, weather, iceInformation);
        
        this.speed = speed;
        this.course = course;
    }

    public GreenPosPositionReport(String vesselName, Long vesselMmsi, String vesselCallSign, String vesselMaritimeId,
            Position position, String weather, String iceInformation, Double speed, Integer course) {
        super(vesselName, vesselMmsi, vesselCallSign, vesselMaritimeId, position, weather, iceInformation);
        
        this.speed = speed;
        this.course = course;
    }

    
    // //////////////////////////////////////////////////////////////////////
    // Object methods
    // //////////////////////////////////////////////////////////////////////
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this);
    }

    // //////////////////////////////////////////////////////////////////////
    // Property methods
    // //////////////////////////////////////////////////////////////////////
    public Double getSpeed() {
        return speed;
    }

    public Integer getCourse() {
        return course;
    }



}
