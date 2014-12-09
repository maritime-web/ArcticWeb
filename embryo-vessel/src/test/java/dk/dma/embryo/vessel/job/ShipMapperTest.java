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

import org.junit.Assert;
import org.junit.Test;

import dk.dma.embryo.vessel.job.ShipTypeCargo.ShipType;
import dk.dma.embryo.vessel.job.ShipTypeMapper.ShipTypeColor;

/**
 * @author Jesper Tejlgaard
 */
public class ShipMapperTest {

    @Test
    public void test() {
        Assert.assertEquals(ShipTypeMapper.getInstance().getColor(ShipType.TANKER), ShipTypeColor.RED);
        Assert.assertEquals(ShipTypeMapper.getInstance().getColor(ShipType.WIG), ShipTypeColor.YELLOW);

        ShipType fishing = ShipType.getShipTypeFromSubType("Fishing");
        Assert.assertEquals(ShipTypeMapper.getInstance().getColor(fishing), ShipTypeColor.ORANGE);
    }
}
