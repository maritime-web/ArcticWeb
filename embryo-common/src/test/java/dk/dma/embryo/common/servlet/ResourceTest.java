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

import java.io.File;

/**
 * Created by Jesper Tejlgaard on 4/19/16.
 */
public class ResourceTest {

    @Test
    public void testExistsWithNull(){
        Resource resource = new Resource(null);
        Assert.assertFalse(resource.exists());
    }

    @Test
    public void testExistWithUnexistingFile(){
        Resource resource = new Resource(new File("unexisting file"));
        Assert.assertFalse(resource.exists());
    }

    @Test
    public void testExistWithExistingFile(){
        String file = getClass().getResource("/default-configuration.properties").getFile();
        Resource resource = new Resource(new File(file));
        Assert.assertTrue(resource.exists());
    }

    @Test
    public void testGetETagWithNull(){
        Resource resource = new Resource(null);
        Assert.assertNull(resource.getETag());
    }

    @Test
    public void testGetETagUnexistingFile(){
        Resource resource = new Resource(new File("unexisting file"));
        Assert.assertNull(resource.getETag());
    }

    @Test
    public void testGetETagExistingFile(){
        String name = getClass().getResource("/default-configuration.properties").getFile();
        File file = new File(name);
        Resource resource = new Resource(file);

        Assert.assertNotNull(resource.getETag());
        Assert.assertNotNull(resource.getETag().getValue());

        String expected = file.length() + "_" + file.lastModified();
        Assert.assertEquals(expected, resource.getETag().getValue());
    }
}
