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

import java.util.Arrays;
import java.util.Objects;

/**
 * Created by Jesper Tejlgaard on 4/19/16.
 */
public class ETag {
    private String value;

    public ETag(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    boolean matches(String matchingValue){
        if(Objects.isNull(matchingValue)){
            return false;
        }
        return matches(this.value, matchingValue);
    }

    private boolean matches(String matchHeader, String toMatch) {
        String[] matchValues = matchHeader.split("\\s*,\\s*");
        Arrays.sort(matchValues);
        return Arrays.binarySearch(matchValues, toMatch) > -1
                || Arrays.binarySearch(matchValues, "*") > -1;
    }
}
