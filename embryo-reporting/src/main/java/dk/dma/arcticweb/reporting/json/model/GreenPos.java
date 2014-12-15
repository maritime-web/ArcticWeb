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
package dk.dma.arcticweb.reporting.json.model;

import dk.dma.embryo.vessel.json.Voyage;
import org.apache.commons.lang.builder.ReflectionToStringBuilder;

import java.util.Date;
import java.util.List;

public class GreenPos {

    private String id;

    private String type;

    private String vesselName;

    private Long mmsi;

    private String callSign;

    private Double lat;

    private Double lon;

    private Integer number;

    private String weather;

    private String ice;

    private Double speed;

    private Integer course;

    private String destination;

    private String malFunctions;

    private Integer personsOnBoard;

    private Date eta;

    private String description;

    private List<Voyage> voyages;

    private String reporter;

    private Date ts;

    private String[] recipients;

    // //////////////////////////////////////////////////////////////////////
    // Constructors
    // //////////////////////////////////////////////////////////////////////
    public GreenPos() {
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
    public String getVesselName() {
        return vesselName;
    }

    public void setVesselName(String name) {
        this.vesselName = name;
    }

    public Long getMmsi() {
        return mmsi;
    }

    public void setMmsi(Long mmsi) {
        this.mmsi = mmsi;
    }

    public String getCallSign() {
        return callSign;
    }

    public void setCallSign(String callSign) {
        this.callSign = callSign;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double latitude) {
        this.lat = latitude;
    }

    public Double getLon() {
        return lon;
    }

    public void setLon(Double longitude) {
        this.lon = longitude;
    }

    public Integer getNumber() {
        return number;
    }

    public void setNumber(Integer number) {
        this.number = number;
    }

    public String getType() {
        return type;
    }

    public void setType(String reportType) {
        this.type = reportType;
    }

    public String getWeather() {
        return weather;
    }

    public void setWeather(String weather) {
        this.weather = weather;
    }

    public String getIce() {
        return ice;
    }

    public void setIce(String iceInformation) {
        this.ice = iceInformation;
    }

    public String getReporter() {
        return reporter;
    }

    public void setReporter(String reportedBy) {
        this.reporter = reportedBy;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public Integer getCourse() {
        return course;
    }

    public void setCourse(Integer course) {
        this.course = course;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public Integer getPersonsOnBoard() {
        return personsOnBoard;
    }

    public void setPersonsOnBoard(Integer personsOnBoard) {
        this.personsOnBoard = personsOnBoard;
    }

    public Date getEta() {
        return eta;
    }

    public void setEta(Date eta) {
        this.eta = eta;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Voyage> getVoyages() {
        return voyages;
    }

    public void setVoyages(List<Voyage> voyages) {
        this.voyages = voyages;
    }

    public Date getTs() {
        return ts;
    }

    public void setTs(Date reportedTs) {
        this.ts = reportedTs;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String[] getRecipients() {
        return recipients;
    }

    public void setRecipients(String[] receipients) {
        this.recipients = receipients;
    }

    public String getMalFunctions() {
        return malFunctions;
    }

    public void setMalFunctions(String malFunctions) {
        this.malFunctions = malFunctions;
    }
}
