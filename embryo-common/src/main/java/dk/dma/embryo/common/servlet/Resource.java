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

/**
 * Created by Jesper Tejlgaard on 4/19/16.
 */
public class Resource {

    private File file;

    private ETag eTag;

    Resource(File file){
        this.file = file;
    }

    public boolean exists() {
        return file != null && file.exists();
    }

    public ETag getETag() {
        if(!exists()) {
            return null;
        }
        if(eTag == null) {
            long length = file.length();
            long lastModified = file.lastModified();
            eTag = new ETag(length + "_" + lastModified);
        }
        return eTag;
    }

}
