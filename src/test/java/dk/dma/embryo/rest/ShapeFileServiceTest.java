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
package dk.dma.embryo.rest;

import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;

public class ShapeFileServiceTest {
    private ShapeFileService service = new ShapeFileService();
    @Test
    public void readFileFromDmi() throws IOException {
        ShapeFileService.Shape file = service.getSingleFile("201304100920_CapeFarewell_RIC", 0, "");
        assertEquals(23, file.getFragments().size());
    }
}
