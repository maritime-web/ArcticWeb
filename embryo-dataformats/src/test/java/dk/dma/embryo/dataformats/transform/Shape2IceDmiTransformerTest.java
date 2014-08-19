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
package dk.dma.embryo.dataformats.transform;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import dk.dma.embryo.dataformats.model.IceObservation;
import dk.dma.embryo.dataformats.model.ShapeFileMeasurement;

/**
 * @author Jesper Tejlgaard
 */
public class Shape2IceDmiTransformerTest {

    private Shape2IceDmiTransformer transformer;

    @Before
    public void setup() {
        Map<String, String> providers = new HashMap<>();
        providers.put("dmi", "DMI");

        Map<String, String> regions = new HashMap<>();
        regions.put("CapeFarewell_RIC", "Cape Farewell");
        regions.put("Greenland_WA", "Greenland Overview");
        
        transformer = new Shape2IceDmiTransformer(providers, regions);
    }

    @Test
    public void testGetProvider() {
        Assert.assertEquals("dmi", transformer.getProvider());
    }

    @Test
    public void testTransform() {
        DateTimeFormatter formatter = DateTimeFormat.forPattern("yyyyMMddHHmm").withZone(DateTimeZone.UTC);
        String dateStr = formatter.print(DateTime.now(DateTimeZone.UTC));

        List<ShapeFileMeasurement> measurements = new ArrayList<>();
        measurements.add(new ShapeFileMeasurement("iceChart", "dmi", dateStr + "_CapeFarewell_RIC", 20000));
        measurements.add(new ShapeFileMeasurement("iceChart", "dmi", dateStr + "_Greenland_WA", 30000));

        List<IceObservation> observations = transformer.transform("iceChart", measurements);

        Assert.assertNotNull(observations);
        Assert.assertEquals(2, observations.size());

        IceObservation ice = observations.get(0);
        Assert.assertEquals(20000, ice.getSize());
        Assert.assertEquals("Cape Farewell", ice.getRegion());
        Assert.assertEquals("iceChart-dmi." + dateStr + "_CapeFarewell_RIC", ice.getShapeFileName());
        Assert.assertEquals("DMI", ice.getSource());
        Assert.assertNotNull(ice.getDate());
        Assert.assertEquals(formatter.print(DateTime.now(DateTimeZone.UTC)), formatter.print(ice.getDate().getTime()));

        // Must work even though region not mapped
        ice = observations.get(1);
        Assert.assertEquals(30000, ice.getSize());
        Assert.assertEquals("Greenland Overview", ice.getRegion());
        Assert.assertEquals("iceChart-dmi." + dateStr + "_Greenland_WA", ice.getShapeFileName());
        Assert.assertEquals("DMI", ice.getSource());
        Assert.assertNotNull(ice.getDate());
        Assert.assertEquals(formatter.print(DateTime.now(DateTimeZone.UTC)), formatter.print(ice.getDate().getTime()));
    }

}
