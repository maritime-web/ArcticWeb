/*
 * Copyright (c) 2011 Danish Maritime Authority.
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

package dk.dma.embryo.tiles.model;

import org.apache.commons.lang.builder.ReflectionToStringBuilder;

import javax.persistence.Embeddable;

/**
 * Created by Jesper Tejlgaard on 10/20/14.
 */


@Embeddable
public class BoundingBox {

    // //////////////////////////////////////////////////////////////////////
    // Entity fields
    // //////////////////////////////////////////////////////////////////////
    private Double minX, minY, maxX, maxY;

    // //////////////////////////////////////////////////////////////////////
    // Constructors
    // //////////////////////////////////////////////////////////////////////
    public BoundingBox() {
    }

    public BoundingBox(Double minX, Double minY, Double maxX, Double maxY) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    // //////////////////////////////////////////////////////////////////////
    // Utility methods
    // //////////////////////////////////////////////////////////////////////

    // //////////////////////////////////////////////////////////////////////
    // Property methods
    // //////////////////////////////////////////////////////////////////////
    public Double getMinX() {
        return minX;
    }

    public Double getMinY() {
        return minY;
    }

    public Double getMaxX() {
        return maxX;
    }

    public Double getMaxY() {
        return maxY;
    }

    public String toString() {
        return new ReflectionToStringBuilder(this).toString();
    }
}
