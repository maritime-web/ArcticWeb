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
package dk.dma.embryo.common.servlet;

import org.junit.Assert;
import org.junit.Test;

/**
 * Created by Jesper Tejlgaard on 4/19/16.
 */
public class ETagTest {

    @Test
    public void testMatchesWithNull(){
        ETag etag = new ETag("etagValue");
        Assert.assertFalse(etag.matches(null));
    }

    @Test
    public void testMatchesDifferentArgument(){
        ETag etag = new ETag("etagValue");
        Assert.assertFalse(etag.matches("different"));
    }

    @Test
    public void testMatchesSameArgument(){
        ETag etag = new ETag("etagValue");
        Assert.assertTrue(etag.matches("etagValue"));
    }

    @Test
    public void testIfStartMatchesEverything(){
        ETag etag = new ETag("*");
        Assert.assertTrue(etag.matches("etagValue"));
        Assert.assertTrue(etag.matches("1"));
        Assert.assertTrue(etag.matches("hep"));
        Assert.assertTrue(etag.matches("1234567890"));
        Assert.assertTrue(etag.matches("+?"));
    }
}
