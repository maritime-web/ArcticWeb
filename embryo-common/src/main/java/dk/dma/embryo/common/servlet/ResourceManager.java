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

import java.io.File;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Objects;

/**
 * Created by Jesper Tejlgaard on 4/19/16.
 */
public class ResourceManager {
    public Resource getRequestedResource(String basePath, String requestedFileURL) throws UnsupportedEncodingException {
        Objects.requireNonNull(basePath, "basePath value required");

        System.out.println(new File(basePath).getAbsolutePath());

        // Check if file is actually supplied to the request URL.
        if (requestedFileURL == null) {
            return new Resource(null);
        }

        // URL-decode the file name (might contain spaces and on) and prepare file object.
        File file = new File(basePath, URLDecoder.decode(requestedFileURL, "UTF-8"));

        return new Resource(file);
    }
}
